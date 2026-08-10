function Footer() {
  return (
    <footer className="border-t border-slate-200 bg-white py-10">
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-4 px-6 text-center text-sm text-slate-500 sm:flex-row sm:justify-between sm:text-left">
        <div className="flex items-center gap-2">
          <span className="flex h-6 w-6 items-center justify-center rounded-md bg-indigo-600 text-xs font-bold text-white">
            G
          </span>
          <span className="font-semibold text-slate-700">GlCnB (Global C&amp;B)</span>
        </div>
        <p>© {new Date().getFullYear()} GlCnB. 해외 유학생을 위한 여정 관리 플랫폼.</p>
      </div>
    </footer>
  )
}

export default Footer
