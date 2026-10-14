import './main';
import source from './main.ts?raw';
import { showCode } from './highlight';

void showCode('#source', source);
