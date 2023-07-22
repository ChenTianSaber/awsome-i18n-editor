import React, { useState, useEffect } from 'react';
import './Table.css';

function Table() {
  const [zhdata, setZhData] = useState([]);
  const [endata, setEnData] = useState([]);

  useEffect(() => {
    window.electron.ipcRenderer.once('read-json', (event) => {
      console.log('数据返回', event);
      setZhData(event.zh);
      setEnData(event.en);
    });
    window.electron.ipcRenderer.sendMessage('ipc-example', 'read-json');
  }, []);

  return (
    <div className="table-container">
      <table>
        <thead>
          <tr>
            <th>中文</th>
            <th>英文</th>
          </tr>
        </thead>
        <tbody>
          <Column zhdata={zhdata} endata={endata} />
        </tbody>
      </table>
    </div>
  );
}

function Column({ zhdata, endata }) {
  const views = [];
  for (let i = 0; i < zhdata.length; i++) {
    const data1 = zhdata[i];
    const data2 = endata[i];
    views.push(
      <tr key={i}>
        <td>{data1.value}</td>
        <td>{data2.value}</td>
      </tr>
    );
  }

  return <div>{views}</div>;
}

export default Table;
