import { Button } from '@/components/ui/button'
import { Link } from 'react-router'

function App() {
  

  return (
    <>
      <div className="p-4">
        <h1 className="text-2xl font-bold mb-4">Home</h1>
        <Link to="/experimental/test-firebase">
          <Button>Go to Experimental Page</Button>
        </Link>
      </div>
    </>
  )
}

export default App
