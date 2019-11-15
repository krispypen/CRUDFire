import {BrowserModule, Title} from '@angular/platform-browser';
import {NgModule} from '@angular/core';

import {AppComponent} from './app.component';

import {AngularFireModule} from '@angular/fire';
import {AngularFireDatabaseModule} from '@angular/fire/database';
import {environment} from '../environments/environment';
import {DocumentsComponent} from './documents/documents.component';
import {DocumentComponent} from './documents/document/document.component';
import {DocumentListComponent} from './documents/document-list/document-list.component';

import {DocumentService} from './shared/document.service';

import {FormsModule} from '@angular/forms';
import {RouterModule, Routes} from '@angular/router';
import {AngularFirestore} from '@angular/fire/firestore';
import {AngularFireAuthModule} from '@angular/fire/auth';
import {AuthService} from './shared/services/auth.service';
import {NgbModule} from '@ng-bootstrap/ng-bootstrap';
import {AngularFireStorageModule} from '@angular/fire/storage';
import {FormelementComponent} from './formelement/formelement.component';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';
import {MatSortModule} from '@angular/material';

const appRoutes: Routes = [
  {path: '', redirectTo: '/documents', pathMatch: 'full'},
  {path: 'documents', component: DocumentsComponent}
];

@NgModule({
  declarations: [
    AppComponent,
    DocumentsComponent,
    DocumentComponent,
    DocumentListComponent,
    FormelementComponent
  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    AngularFireModule.initializeApp(environment.firebaseConfig),
    AngularFireAuthModule,
    AngularFireDatabaseModule,
    AngularFireStorageModule,
    FormsModule,
    MatSortModule,
    NgbModule,
    RouterModule.forRoot(
      appRoutes,
      {enableTracing: true}
    )
  ],
  exports: [RouterModule],
  providers: [DocumentService, AngularFirestore, AuthService, Title],
  bootstrap: [AppComponent]
})
export class AppModule {
}
