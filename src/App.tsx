import Clock from './components/Clock';
import PlayerStartButton from './components/PlayerStartButton';

function App() {
  return (
    <>
      <main className="items-center justify-center flex flex-col gap-4">
        <Clock />
        <PlayerStartButton />
      </main>
    </>
  );
}

export default App;
