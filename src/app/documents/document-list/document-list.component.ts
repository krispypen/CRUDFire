import {Component, HostListener, OnInit, ViewChild} from '@angular/core';

import {saveAs} from 'file-saver';

import * as XLSX from 'xlsx';

import {AngularFirestore} from '@angular/fire/firestore';
import {DocumentService} from '../../shared/document.service';
import {Document} from '../../shared/document.model';
import {ActivatedRoute} from '@angular/router';
import {CollectionDefinition, FieldDefinition, FieldType} from '../collection-definition';
import {firestore as Firestore} from 'firebase';
import {DocumentComponent} from '../document/document.component';
import {Observable, of} from 'rxjs';
import {map} from 'rxjs/operators';
import {MatSort, Sort} from '@angular/material';

@Component({
  selector: 'app-document-list',
  templateUrl: './document-list.component.html',
  styleUrls: ['./document-list.component.css']
})

export class DocumentListComponent implements OnInit {

  rawList: Document[];
  list: Document[];
  @ViewChild(MatSort, {static: false}) tableSort: MatSort;
  collectionDefinition: CollectionDefinition;
  fieldType = FieldType;
  permissionDenied = false;
  @ViewChild(DocumentComponent, {static: false}) documentComponent: DocumentComponent;
  private possibleValues = new Map<FieldDefinition, Observable<Map<string, string>>>();

  static getFilenameFromUrl(url: any) {
    if (typeof (url) === 'string') {
      const filenameWithParams = url.substring(url.lastIndexOf('/') + 1);
      let filename = filenameWithParams.substring(0, filenameWithParams.indexOf('?'));
      if (url.startsWith('https://firebasestorage.googleapis.com')) {
        filename = decodeURI(filename.substring(filename.indexOf('_') + 1));
      }
      return filename;
    }
    return null;
  }

  constructor(private service: DocumentService,
              private firestore: AngularFirestore,
              private activatedRoute: ActivatedRoute) {
  }

  @HostListener('window:keyup', ['$event'])
  keyEvent(event: KeyboardEvent) {
    if (event.ctrlKey && event.key.toLowerCase() === 'n' && !this.documentComponent.isModalOpen()) {
      this.onNew();
    }
  }

  isSortable(column: FieldDefinition) {
    return [this.fieldType.Text, this.fieldType.Email, this.fieldType.Number].indexOf(column.type) >= 0;
  }

  sortData(sort: Sort) {
    this.list = this.sortInternal(this.list);
    this.rawList = this.sortInternal(this.rawList);
  }

  sortInternal(listToSort: Document[]) {
    if (this.tableSort == null || this.tableSort.active == null) {
      return listToSort;
    }
    return listToSort.sort((a, b) => {
      const isAsc = this.tableSort.direction === 'asc';
      return (a[this.tableSort.active] < b[this.tableSort.active] ? -1 : 1) * (isAsc ? -1 : 1);
    });
  }

  ngOnInit() {
    this.activatedRoute.queryParams.subscribe(params => {
      this.permissionDenied = false;
      if (this.tableSort != null) {
        this.tableSort.active = null;
        this.tableSort.direction = 'desc';
      }
      const type = params['type'];
      this.collectionDefinition = this.service.getCollectionDefinitions().get(type);
      if (this.collectionDefinition != null) {
        for (const field of this.collectionDefinition.fields) {
          this.possibleValues.set(field, this.getPossibleValuesInternal(field));
        }
        this.service.getDocuments(this.collectionDefinition.collection, this.collectionDefinition.queryFn)
          .subscribe(actionArray => {
            this.rawList = this.sortInternal(actionArray.map(item => {
              const t = {
                id: item.payload.doc.id,
                ...item.payload.doc.data()
              } as Document;
              return t;
            }));
            this.list = this.sortInternal(this.rawList.map(item => {
              const t = Object.assign({}, item);
              for (const field of this.collectionDefinition.fields) {
                if (field.type === FieldType.Timestamp) {
                  if (t[field.name] != null && t[field.name] instanceof Firestore.Timestamp) {
                    const tzoffset = (new Date()).getTimezoneOffset() * 60000;
                    const newDate = new Date(t[field.name].toDate() - tzoffset);
                    t[field.name] = newDate.toISOString().substring(0, 16);
                  }
                  if (t[field.name] != null && t[field.name] instanceof Date) {
                    const newDate = t[field.name] as Date;
                    t[field.name] = newDate.toISOString().substring(0, 16);
                  }
                }
              }
              return t;
            }));
          }, error => {
            if (error.code === 'permission-denied') {
              this.permissionDenied = true;
            }
          });
      }
    });
  }

  formatDate(timestamp: Date) {
    return timestamp;
  }

  getFilenameFromUrl(url: any) {
    return DocumentListComponent.getFilenameFromUrl(url);
  }

  onEdit(doc: Document) {
    const clonedDoc = JSON.parse(JSON.stringify(doc)) as Document;
    this.doPreEdit(clonedDoc);
    this.service.formData = JSON.parse(JSON.stringify(clonedDoc));
    this.documentComponent.openModal();
  }

  onNew() {
    this.documentComponent.resetForm();
    const clonedDoc = new Document();
    this.doPreEdit(clonedDoc);
    this.service.formData = Object.assign({}, clonedDoc);
    this.documentComponent.openModal();
  }

  getPossibleValues(field: FieldDefinition): Observable<Map<string, string>> {
    return this.possibleValues.get(field);
  }

  getPossibleValuesInternal(field: FieldDefinition): Observable<Map<string, string>> {
    if (field.hasOwnProperty('possibleValues')) {
      return of(field.possibleValues);
    }
    if (field.hasOwnProperty('possibleValuesFromCollection')) {
      const p = field.possibleValuesFromCollection;
      const t = this.firestore.collection(p.collection, p.queryFn).snapshotChanges().pipe(
        map(changes => {
          const result = new Map<string, string>();
          changes.forEach(a => {
            const doc = a.payload.doc.data() as Document;
            doc.id = a.payload.doc.id;
            result.set(p.getID(doc), p.getDisplayName(doc));
          });
          return result;
        }),
      );
      return t;
    }
    return of(new Map<string, string>());
  }

  stringValue(doc: Document, column: string) {
    for (const field of this.collectionDefinition.fields) {
      if (field.name === column) {
        if (field.hasOwnProperty('possibleValues')) {
          const possibleValues = field.possibleValues;
          return possibleValues.get(doc[column]);
        }
      }
    }
    if (doc[column] instanceof Object) {
      return JSON.stringify(doc[column], undefined, 2).slice(2, -2);
    }
    return doc[column];
  }

  canDelete(doc: Document) {
    if (this.collectionDefinition['canDelete'] instanceof Function) {
      return this.collectionDefinition.canDelete(doc);
    }
    return true;
  }

  onDelete(id: string) {
    if (confirm('Are you sure to delete this record?')) {
      this.firestore.doc(this.collectionDefinition.collection + '/' + id).delete();
    }
  }

  private doPreEdit(doc: Document) {
    if (this.collectionDefinition['preEdit'] instanceof Function) {
      this.collectionDefinition.preEdit(doc);
    }
    for (const field of this.collectionDefinition.fields) {
      if (field.type === FieldType.Timestamp) {
        if (doc[field.name] != null && doc[field.name] instanceof Firestore.Timestamp) {
          const tzoffset = (new Date()).getTimezoneOffset() * 60000;
          const newDate = new Date(doc[field.name].toDate() - tzoffset);
          doc[field.name] = newDate.toISOString().substring(0, 16);
        }
        if (doc[field.name] != null && doc[field.name] instanceof Date) {
          const tzoffset = (new Date()).getTimezoneOffset() * 60000;
          const date = doc[field.name] as Date;
          const newDate = new Date(date.getTime() - tzoffset);
          doc[field.name] = newDate.toISOString().substring(0, 16);
        }
      }
    }
  }

  _getExportData() {
    const exportData = [];
    // Headers:
    const headers = [];
    for (const field of this.collectionDefinition.fields) {
      headers.push(field.displayName);
    }
    exportData.push(headers);
    for (const doc of this.rawList) {
      const line = [];
      for (const field of this.collectionDefinition.fields) {
        let value = doc[field.name];
        if (value instanceof Array || value instanceof Object) {
          value = JSON.stringify(value);
        }
        line.push(value.toString());
      }
      exportData.push(line);
    }
    return exportData;
  }

  exportToJSON() {
    const exportData = this.rawList;

    const json = JSON.stringify(exportData, null, 4);

    const blob = new Blob([json], {type: 'application/json'});
    saveAs(blob, this.collectionDefinition.name + '.json');
  }

  exportToCSV() {
    const exportData = this._getExportData();
    const header = Object.keys(exportData[0]);
    const csv = exportData.map(row => header.map(fieldName => '"' + row[fieldName].replace(/"/g, '""') + '"'));
    const csvArray = csv.join('\r\n');

    const blob = new Blob([csvArray], {type: 'text/csv'});
    saveAs(blob, this.collectionDefinition.name + '.csv');
  }

  exportToXLSX() {
    const exportData = this._getExportData();
    const workSheet: XLSX.WorkSheet = XLSX.utils.aoa_to_sheet(exportData);
    const workBook: XLSX.WorkBook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workBook, workSheet, 'Main');

    const wbout = XLSX.write(workBook, {bookType: 'xlsx', bookSST: true, type: 'binary'});

    function s2ab(s) {
      const buf = new ArrayBuffer(s.length);
      const view = new Uint8Array(buf);
      for (let i = 0; i !== s.length; ++i) {
        // tslint:disable-next-line:no-bitwise
        view[i] = s.charCodeAt(i) & 0xFF;
      }
      return buf;
    }

    saveAs(new Blob([s2ab(wbout)], {type: 'application/octet-stream'}), this.collectionDefinition.name + '.xlsx');
  }

  startImport(fileField, event: FileList) {
    // The File object
    const file = event.item(0);

    const fileReader = new FileReader();
    fileReader.onload = (e) => {
      const docs = JSON.parse(fileReader.result.toString()) as Document[];
      for (const doc of docs) {
        const documentid = doc['id'];
        const data = {};
        for (const field of this.collectionDefinition.fields) {
          // TODO: recursive
          if (field.isArray) {
            const array = doc[field.name] as Array<string>;
            data[field.name] = [];
            array.forEach((item, index) => {
              data[field.name][index] = DocumentComponent.convertToFirebaseValue(field, item);
            });
          } else {
            data[field.name] = DocumentComponent.convertToFirebaseValue(field, doc[field.name]);
          }
          /*if (field.type === FieldType.Timestamp) {
              data[field.name] = new Firestore.Timestamp(doc[field.name]['seconds'], doc[field.name]['nanoseconds'])
          } else if (field.type === FieldType.Geopoint) {
              data[field.name] = new Firestore.GeoPoint(doc[field.name]['_lat'], doc[field.name]['_long'])
          } else {
              data[field.name] = doc[field.name] || null;
          }*/
        }
        console.log(data);
        this.firestore.collection(this.collectionDefinition.collection).doc(documentid).set(data).catch(reason => {
          alert(reason.toString());
        });
      }
      fileField.value = '';
    };
    fileReader.readAsText(file);
    // TODO: clear the file input
  }

}
