import { MemoryRouter as Router, Routes, Route } from 'react-router-dom';
import icon from '../../assets/icon.svg';
import Table from './component/Table';

function Hello() {
  return (
    <div>
      <div className="Hello">
        <button
          type="button"
          onClick={() => {
            console.log('点击');
            window.electron.ipcRenderer.once('ipc-example', () => {});
            window.electron.ipcRenderer.sendMessage('ipc-example', 'save-json');
          }}
        >
          保存Json
        </button>
        <Table />
      </div>
    </div>
  );
}

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Hello />} />
      </Routes>
    </Router>
  );
}
