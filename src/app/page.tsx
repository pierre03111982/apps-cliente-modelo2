export default function HomePage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-900 text-white">
      <div className="text-center">
        <h1 className="mb-4 text-2xl font-bold">Experimente AI - Modelo 1</h1>
        <p className="mb-2 text-gray-400">
          Acesse o aplicativo usando o link completo com o ID da loja:
        </p>
        <p className="text-sm text-gray-500">
          https://apps-clientes-modelos.vercel.app/[lojistaId]/login
        </p>
      </div>
    </div>
  );
}


