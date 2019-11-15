import {Component, OnInit} from '@angular/core';
import {AuthService} from '../shared/services/auth.service';
import {CollectionDefinition} from './collection-definition';
import {DocumentService} from '../shared/document.service';
import {ActivatedRoute, Router} from '@angular/router';

@Component({
  selector: 'app-documents',
  templateUrl: './documents.component.html',
  styleUrls: ['./documents.component.css']
})
export class DocumentsComponent implements OnInit {

  collectionDefinitions: Map<string, CollectionDefinition>;
  collectionDefinitionsList: CollectionDefinition[];
  collectionDefinition: CollectionDefinition;

  constructor(public authService: AuthService,
              private service: DocumentService,
              private activatedRoute: ActivatedRoute,
              public router: Router) {
    this.collectionDefinitions = this.service.getCollectionDefinitions();
    this.collectionDefinitionsList = Array.from(this.collectionDefinitions.values());
  }

  ngOnInit() {
    this.activatedRoute.queryParams.subscribe(params => {
      const type = params['type'];
      if (type === undefined && this.authService.isLoggedIn) {
        this.router.navigate(['documents'], {queryParams: {type: this.collectionDefinitions.values().next().value.name}});
      }
      this.collectionDefinition = this.service.getCollectionDefinitions().get(type);
    });
  }

}
