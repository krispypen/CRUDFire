# CrudFire

CrudFire is an easy way to manage your Firebase Cloud Firestore database.

## Firebase configuration

You can put your firebase credentials in src/environments/environment.ts and src/environments/environment.prod.ts for production.

## Crud configuration

You can put your configuration into src/environments/columndefinition.ts

## Supported fields

We currently support these type of fields:
* Text
* Textarea
* Number
* Email
* Image
* File
* Timestamp
* Select
* Map
* Geopoint

## Permissions

Since we use google login you'll have to enable that in the firebase authentication settings. And for the permission rules you can use your own, we prefer something like:

```
function isAdmin(database) {
	return request.auth.uid != null && exists(/databases/$(database)/documents/admin_users/$(request.auth.token.email));
}

function isUser(database) {
	return request.auth.uid != null && exists(/databases/$(database)/documents/users/$(request.auth.uid));
}

service cloud.firestore {
  match /databases/{database}/documents {

    // All users and admins can read Skills
    // All users and admins can write Skills
    match /skills/{skill} {
    	allow read, write: if isUser(database) || isAdmin(database);
    }

    // All users and admins can read Teams
    // Only admins can write Teams
    match /teams/{team} {
    	allow read: if isUser(database) || isAdmin(database);
      allow write: if isAdmin(database);
    }

    // All users can read Users
		// Only own user can write own user and admins can write to all users
    match /users/{user} {
    	allow read: if isUser(database) || isAdmin(database);
      allow write: if (isUser(database) && resource.id == request.auth.uid) || isAdmin(database);
    }
    
  }
}
```

