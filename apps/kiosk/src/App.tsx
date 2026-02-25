import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

const queryClient = new QueryClient()

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <div className="flex h-screen items-center justify-center">
        <h1 className="text-4xl font-bold">키오스크</h1>
      </div>
    </QueryClientProvider>
  )
}
