import './main';
import source from './SmithChartComponent.ts?raw';
import application from './main.ts?raw';
import data from '../framework-data.ts?raw';
import '../style.css';
import '../framework.css';
import { showCode } from '../basic/highlight';

void showCode('#source', source);
void showCode('#markup', application + '\n\n// framework-data.ts\n' + data);
