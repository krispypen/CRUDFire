import {CollectionDefinition, FieldType, PossibleValueFromCollectionDefinition} from '../app/documents/collection-definition';
import {Document} from '../app/shared/document.model';

export const columnDefinition = new Map<string, CollectionDefinition>(
  [
    ['users', {
      name: 'users',
      displayName: 'User',
      displayNamePlural: 'Users',
      collection: 'users',
      queryFn: ref => ref.orderBy('id'),
      fields: [
        {
          name: 'full_name',
          displayName: 'Full name',
          type: FieldType.Text,
        },
        {
          name: 'title',
          displayName: 'Title',
          type: FieldType.Text,
        },
        {
          name: 'large_image',
          displayName: 'Large image',
          required: true,
          hideFromList: true,
          type: FieldType.Image,
        },
        {
          name: 'small_image',
          displayName: 'Small image',
          required: true,
          type: FieldType.Image,
        },
        {
          name: 'email',
          displayName: 'Email',
          type: FieldType.Email,
        },
        {
          name: 'description',
          displayName: 'Description',
          hideFromList: true,
          type: FieldType.Textarea,
        },
        {
          name: 'skills',
          displayName: 'Skills',
          required: true,
          isArray: true,
          hideFromList: true,
          type: FieldType.Text,
          possibleValuesFromCollection: {
            collection: 'skills',
            queryFn: ref => ref.orderBy('name'),
            getDisplayName: (doc: Document) => {
              return doc['name'];
            },
            getID: (doc: Document) => {
              return doc['id'];
            }
          } as PossibleValueFromCollectionDefinition
        },
        {
          name: 'team',
          displayName: 'Team',
          required: true,
          type: FieldType.Text,
          possibleValuesFromCollection: {
            collection: 'teams',
            queryFn: ref => ref.orderBy('id'),
            getDisplayName: (doc: Document) => {
              return doc['name'];
            },
            getID: (doc: Document) => {
              return doc['name'];
            }
          } as PossibleValueFromCollectionDefinition
        },
        {
          name: 'phone_number',
          displayName: 'Phone',
          type: FieldType.Text,
        },
        {
          name: 'quote',
          displayName: 'Quote',
          type: FieldType.Text,
        },
      ]
    } as CollectionDefinition],
    ['skills', {
      name: 'skills',
      displayName: 'Skill',
      displayNamePlural: 'Skills',
      collection: 'skills',
      queryFn: ref => ref.orderBy('name'),
      fields: [
        {
          name: 'name',
          displayName: 'Name',
          required: true,
          type: FieldType.Text
        },
      ]
    } as CollectionDefinition],
    ['teams', {
      name: 'teams',
      displayName: 'Team',
      displayNamePlural: 'Teams',
      collection: 'teams',
      queryFn: ref => ref.orderBy('name'),
      fields: [
        {
          name: 'name',
          displayName: 'Name',
          required: true,
          type: FieldType.Text
        },
      ]
    } as CollectionDefinition],
  ]
);
