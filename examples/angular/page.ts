import './main';
import source from './SmithChartComponent.ts?raw';
import application from './main.ts?raw';
import data from '../framework-data.ts?raw';
import '../style.css';
import '../framework.css';

document.querySelector('#source')!.textContent = source;
document.querySelector('#markup')!.textContent = application + '\n\n// framework-data.ts\n' + data;
