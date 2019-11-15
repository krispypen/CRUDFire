import {Injectable} from '@angular/core';

import {Document} from './document.model';
import {AngularFirestore} from '@angular/fire/firestore';
import {CollectionDefinition} from '../documents/collection-definition';
import {environment} from '../../environments/environment';
import {QueryFn} from '@angular/fire/firestore/interfaces';


@Injectable({
  providedIn: 'root'
})
export class DocumentService {
  formData: Document;

  constructor(private firestore: AngularFirestore) {

  }

  getDocuments(type: string, ref?: QueryFn) {
    return this.firestore.collection(type, ref).snapshotChanges();
  }

  getCollectionDefinitions(): Map<string, CollectionDefinition> {
    return environment.columnDefinition;
  }
}
