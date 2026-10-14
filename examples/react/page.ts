import './main';
import source from './SmithChart.tsx?raw';
import application from './main.tsx?raw';
import data from '../framework-data.ts?raw';
import '../style.css';
import '../framework.css';
import { showCode } from '../basic/highlight';

void showCode('#source', source, 'tsx');
void showCode('#markup', application + '\n\n// framework-data.ts\n' + data, 'tsx');
