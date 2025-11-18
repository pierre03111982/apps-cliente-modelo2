export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-900 text-white px-4">
      <div className="text-center max-w-2xl">
        <h1 className="mb-4 text-2xl md:text-3xl font-bold">
          404 - Página não encontrada
        </h1>
        <p className="mb-2 text-gray-400 text-lg">
          A página que você está procurando não existe.
        </p>
        <p className="text-sm text-gray-500 break-all mb-6">
          Acesse o aplicativo usando o link completo com o ID da loja:
        </p>
        <p className="text-sm text-gray-500 break-all mb-6">
          https://apps-cliente-modelo1.vercel.app/[lojistaId]/login
        </p>
      </div>
    </div>
  )
}

