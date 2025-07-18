import Application from '@ember/application';
import compatModules from '@embroider/virtual/compat-modules';
import Resolver from 'ember-resolver';

export default class App extends Application {
  modulePrefix = 'test-app';
  Resolver = Resolver.withModules(compatModules);
}
