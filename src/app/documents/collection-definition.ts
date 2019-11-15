import {Document} from '../shared/document.model';
import {QueryFn} from '@angular/fire/firestore';

export class CollectionDefinition {
  name: string;
  displayName: string;
  displayNamePlural: string;
  collection: string;
  fields: FieldDefinition[];
  queryFn: QueryFn;

  canDelete(doc: Document): boolean {
    return true;
  }

  preEdit(doc: Document) {
  }
}

export interface FieldDefinition {
  displayName: string;
  name: string;
  maxlength: number;
  required: boolean;
  description: string;
  hideFromList: boolean;
  type: FieldType;
  possibleValues: Map<string, string>;
  possibleValuesFromCollection: PossibleValueFromCollectionDefinition;
  isArray: boolean;
  itemDisplayName: string; // TODO rename displayName to displayNamePlural and this to displayName
  fields: FieldDefinition[];
}

export class PossibleValueFromCollectionDefinition {
  collection: string;
  queryFn: QueryFn;

  getDisplayName(doc: Document): string {
    return '';
  }

  getID(doc: Document): string {
    return doc.id;
  }
}

export enum FieldType {
  Text = 'text',
  Textarea = 'textarea',
  Number = 'number',
  Email = 'email',
  Image = 'image',
  File = 'file',
  Timestamp = 'timestamp',
  Select = 'select',
  Map = 'map',
  Geopoint = 'geopoint'
}
