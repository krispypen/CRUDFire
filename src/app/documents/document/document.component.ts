import {Component, ContentChildren, ElementRef, HostListener, OnInit, QueryList, ViewChild} from '@angular/core';

import {DocumentService} from '../../shared/document.service';
import {NgForm} from '@angular/forms';
import {AngularFirestore} from '@angular/fire/firestore';
import {AngularFireStorage} from '@angular/fire/storage';
import {ActivatedRoute} from '@angular/router';
import {CollectionDefinition, FieldDefinition, FieldType} from '../collection-definition';
import {firestore as Firestore} from 'firebase';
import {NgbModal} from '@ng-bootstrap/ng-bootstrap';
import {NgbModalRef} from '@ng-bootstrap/ng-bootstrap/modal/modal-ref';
import {Observable} from 'rxjs';
import {FormelementComponent} from '../../formelement/formelement.component';

@Component({
  selector: 'app-document',
  templateUrl: './document.component.html',
  styleUrls: ['./document.component.css']
})
export class DocumentComponent implements OnInit {

  @ViewChild('editform', {static: false}) modal: ElementRef;
  collectionDefinition: CollectionDefinition;
  selectedFiles: FileList;
  fieldType = FieldType;
  private type: string;
  private modalRef: NgbModalRef;
  private possibleValues = new Map<FieldDefinition, Observable<[string, string][]>>();

  static convertToFirebaseValue(field: FieldDefinition, value: any): any {
    if (value === undefined) {
      return null;
    }
    if (field.type === FieldType.Timestamp) {
      const date = new Date(value);
      return Firestore.Timestamp.fromDate(date);
    }
    if (field.type === FieldType.Geopoint) {
      const latitude = value['_lat'] as number;
      const longitude = value['_long'] as number;
      if (latitude != null && longitude != null) {
        return new Firestore.GeoPoint(latitude, longitude);
      } else {
        return null;
      }
    }
    if ((field.type === FieldType.Select) && value === null) {
      return [];
    }
    return value;
  }

  constructor(public service: DocumentService,
              private firestore: AngularFirestore,
              private storage: AngularFireStorage,
              private activatedRoute: ActivatedRoute,
              private modalService: NgbModal) {
  }


  @HostListener('window:keyup', ['$event'])
  keyEvent(event: KeyboardEvent) {
    if (event.ctrlKey && event.key.toLowerCase() === 's' && this.isModalOpen()) {
      const submitButton = document.getElementById('submitButton');
      if (submitButton != null) {
        submitButton.click();
      }
    }
  }

  ngOnInit() {
    this.activatedRoute.queryParams.subscribe(params => {
      this.type = params['type'];
      this.collectionDefinition = this.service.getCollectionDefinitions().get(this.type);
    });
    this.resetForm();
  }

  formatDate(timestamp: Firestore.Timestamp) {
    return timestamp.toDate().toLocaleDateString() + ' ' + timestamp.toDate().toLocaleTimeString();
  }

  resetForm(form?: NgForm) {
    if (form != null) {
      form.resetForm();
    }
    this.service.formData = {
      id: null
    };
  }

  isValid() {
    return document.getElementsByClassName('formelement-error').length === 0;
  }

  onSubmit(form: NgForm) {
    const data = Object.assign({}, this.service.formData);
    for (const field of this.collectionDefinition.fields) {
      if (field.isArray) {
        const array = data[field.name] as Array<string>;
        array.forEach((item, index) => {
          data[field.name][index] = DocumentComponent.convertToFirebaseValue(field, item);
        });
      } else {
        data[field.name] = DocumentComponent.convertToFirebaseValue(field, data[field.name]);
      }
    }
    delete data.id;
    if (form.value.id == null) {
      this.firestore.collection(this.collectionDefinition.collection).add(data).catch(reason => {
        alert(reason.toString());
      });
    } else {
      this.firestore.doc(this.collectionDefinition.collection + '/' + form.value.id).update(data).catch(reason => {
        alert(reason.toString());
      });
    }
    this.resetForm(form);
    this.modalRef.close();
  }

  openModal() {
    this.modalRef = this.modalService.open(this.modal, {ariaLabelledBy: 'modal-basic-title', size: 'lg'});
    this.modalRef.result.then((result) => {
      // modalRef.close();
    }, (reason) => {
      // modalRef.close();
    });
  }

  isModalOpen(): boolean {
    return this.modalService.hasOpenModals();
  }

}
