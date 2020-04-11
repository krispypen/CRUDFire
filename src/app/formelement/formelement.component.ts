import {Component, Input, OnInit} from '@angular/core';
import {CollectionDefinition, FieldDefinition, FieldType} from '../documents/collection-definition';
import {NgbModal} from '@ng-bootstrap/ng-bootstrap';
import {AngularFirestore} from '@angular/fire/firestore';
import {DocumentService} from '../shared/document.service';
import {AngularFireStorage, AngularFireUploadTask} from '@angular/fire/storage';
import {ActivatedRoute} from '@angular/router';
import {Observable, of} from 'rxjs';
import {finalize, map, tap} from 'rxjs/operators';
import {Document} from '../shared/document.model';
import {animate, state, style, transition, trigger,} from '@angular/animations';
import {DocumentListComponent} from '../documents/document-list/document-list.component';

@Component({
  selector: 'app-formelement',
  templateUrl: './formelement.component.html',
  styleUrls: ['./formelement.component.css'],
  animations: [
    trigger('simpleFadeAnimationParent', [
      transition(':enter', [])
    ]),
    // the fade-in/fade-out animation.
    trigger('simpleFadeAnimation', [

      // the "in" style determines the "resting" state of the element when it is visible.
      state('in', style({height: '*'})),

      // fade in when created. this could also be written as transition('void => *')
      transition(':enter', [
        style({height: 0}),
        animate(400)
      ]),

      // fade out when destroyed. this could also be written as transition('void => *')
      transition(':leave',
        animate(400, style({height: 0})))
    ])
  ]
})
export class FormelementComponent implements OnInit {

  @Input() field: FieldDefinition;
  @Input() collectionDefinition: CollectionDefinition;
  @Input() arrayIndex: number;
  @Input() formData: Object;
  fieldType = FieldType;
  private possibleValues: Observable<[string, string][]>;
  private isRequiredAndEmtpySubject: Observable<boolean> = of(false);
  percentage: Observable<number>;
  snapshot: Observable<any>;
  task: AngularFireUploadTask;

  constructor(public service: DocumentService,
              private firestore: AngularFirestore,
              private storage: AngularFireStorage,
              private activatedRoute: ActivatedRoute,
              private modalService: NgbModal) {
  }

  ngOnInit() {
    this.possibleValues = this.getPossibleValuesInternal(this.field);
    if (this.field.isArray && this.getValue() == null) {
      this.setValue([]);
    }
    if (this.field.type === FieldType.Geopoint && this.getValue() == null) {
      this.setValue(new Object());
    }
    if (this.field.type === FieldType.Map && this.getValue() == null) {
      this.setValue(new Object());
    }
  }

  getArrayIndex(index, item) {
    return index;
  }

  isRequiredAndEmtpy(extraselector?: string): Observable<boolean> {
    return this.isRequiredAndEmtpySubject;
  }

  validateValueInternal() {
    if (!this.field.required) {
      this.isRequiredAndEmtpySubject = of(false);
    } else {
      const value = this.getValue();
      this.isRequiredAndEmtpySubject = of(value === '' || value == null);
    }
  }

  getFilenameFromUrl(url: any) {
    return DocumentListComponent.getFilenameFromUrl(url);
  }

  getValue(extraselector?: string) {
    if (this.arrayIndex != null) {
      if (extraselector != null) {
        return this.formData[this.field.name][this.arrayIndex][extraselector];
      }
      return this.formData[this.field.name][this.arrayIndex];
    } else {
      if (extraselector != null) {
        return this.formData[this.field.name][extraselector];
      }
      return this.formData[this.field.name];
    }
  }

  setValue(value: Object, extraselector?: string) {
    if (this.arrayIndex != null) {
      if (extraselector != null) {
        this.formData[this.field.name][this.arrayIndex][extraselector] = value;
      } else {
        this.formData[this.field.name][this.arrayIndex] = value;
      }
    } else {
      if (extraselector != null) {
        this.formData[this.field.name][extraselector] = value;
      } else {
        this.formData[this.field.name] = value;
      }
    }
    this.validateValueInternal();
  }

  getPossibleValues(field: FieldDefinition): Observable<[string, string][]> {
    return this.possibleValues;
  }

  getInitialValue(field: FieldDefinition) {
    //TODO define a default value in FieldDefiniation?
    switch(field.type) {
      case FieldType.Text:
      case FieldType.Textarea:
      case FieldType.Email:
      case FieldType.Image:
        return '';
      case FieldType.Boolean:
        return false;
      case FieldType.Number:
        return 0;
    }
    return {};
  }

  getPossibleValuesInternal(field: FieldDefinition): Observable<[string, string][]> {
    if (field.hasOwnProperty('possibleValues')) {
      return of(Array.from(field.possibleValues.entries()));
    }
    if (field.hasOwnProperty('possibleValuesFromCollection')) {
      const p = field.possibleValuesFromCollection;
      const t = this.firestore.collection(p.collection, p.queryFn).snapshotChanges().pipe(
        map(changes => {
          return changes.map(a => {
            const doc = a.payload.doc.data() as Document;
            doc.id = a.payload.doc.id;
            return [p.getID(doc), p.getDisplayName(doc)] as [string, string];
          });
        }),
      );
      return t;
    }
    return of([] as [string, string][]);
  }

  startUpload(event: FileList) {
    // The File object
    const file = event.item(0);

    // The storage path
    const path = this.collectionDefinition.collection + `/${new Date().getTime()}_${file.name}`;

    // Metadata
    const customMetadata = {app: 'Uploaded by CRUDFire'};

    // The main task
    this.task = this.storage.upload(path, file, {customMetadata});

    // Progress monitoring
    this.percentage = this.task.percentageChanges();
    this.task.snapshotChanges().pipe(
      tap(snap => {
        if (snap.bytesTransferred === snap.totalBytes) {
          // doc[field] = this.storage.ref(path).getDownloadURL();
          // Update firestore on completion
          // this.db.collection('photos').add({ path, size: snap.totalBytes });
        }
      }),
      finalize(() => {
        this.storage.ref(path).getDownloadURL().subscribe(val => {
          this.setValue(val);
        });
      })
    ).subscribe();


    // The file's download URL
  }

}
