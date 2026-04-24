import Board from './components/Board';

function App() {
  return (
    <div className="min-h-screen flex flex-col font-sans">
      <header className="bg-blue-700 text-white p-4 shadow-md flex items-center">
        <h1 className="text-2xl font-bold tracking-tight">Kanban Assessment</h1>
      </header>
      
      <main className="flex-grow">
        <Board />
      </main>
    </div>
  );
}

export default App;