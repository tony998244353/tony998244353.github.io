import { DragonCurveCanvas } from './components/DragonCurveCanvas';
import './App.css';

export default function App() {
  return (
    <div className="app">
      <DragonCurveCanvas />
      <div className="overlay">
        <img src="/assets/icon.png" alt="Avatar" className="avatar" />
        <h1>tony</h1>
        <p className="hint">Scroll to zoom</p>
      </div>
    </div>
  );
}
