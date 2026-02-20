'use client'

import { useState, useEffect } from 'react'

interface Convidado {
  id: string
  nomeCompleto: string
  cpf: string
  telefone: string
  entrou: boolean
  createdAt: string
}

function formatCPF(v: string) {
  const d = v.replace(/\D/g, '')
  if (d.length <= 3) return d
  if (d.length <= 6) return `${d.slice(0, 3)}.${d.slice(3)}`
  if (d.length <= 9) return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6)}`
  return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9, 11)}`
}

function formatTel(v: string) {
  const d = v.replace(/\D/g, '')
  if (d.length <= 2) return d ? `(${d}` : ''
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7, 11)}`
}

function escapeHtml(s: string) {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

export default function ListaConvidadosPage() {
  const [list, setList] = useState<Convidado[]>([])
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [nome, setNome] = useState('')
  const [cpf, setCpf] = useState('')
  const [telefone, setTelefone] = useState('')
  const [saving, setSaving] = useState(false)
  const [importing, setImporting] = useState(false)

  useEffect(() => {
    fetchList()
  }, [])

  async function fetchList() {
    try {
      const res = await fetch('/api/admin/lista-convidados')
      if (res.ok) {
        const data = await res.json()
        setList(
          Array.isArray(data)
            ? data.map((c: Convidado) => ({
                ...c,
                entrou: Boolean(c?.entrou),
              }))
            : []
        )
      }
    } catch (e) {
      console.error(e)
      setError('Erro ao carregar lista')
    } finally {
      setLoading(false)
    }
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setMessage('')
    if (!nome.trim() || !cpf.trim() || !telefone.trim()) {
      setError('Preencha Nome, CPF e Telefone')
      return
    }
    setSaving(true)
    try {
      const res = await fetch('/api/admin/lista-convidados', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nomeCompleto: nome.trim(),
          cpf: cpf.trim().replace(/\D/g, ''),
          telefone: telefone.trim().replace(/\D/g, ''),
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || 'Erro ao adicionar')
      setMessage('Convidado adicionado.')
      setNome('')
      setCpf('')
      setTelefone('')
      await fetchList()
    } catch (err: any) {
      setError(err.message || 'Erro ao adicionar')
    } finally {
      setSaving(false)
    }
  }

  function handleDownloadTemplate() {
    window.open('/api/admin/lista-convidados/template', '_blank')
    setMessage('Template baixado. Envie o arquivo para alguém preencher e depois importe aqui.')
  }

  function triggerImport() {
    const input = document.getElementById('import-csv') as HTMLInputElement
    input?.click()
  }

  async function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setError('')
    setMessage('')
    setImporting(true)
    try {
      const form = new FormData()
      form.append('file', file)
      const res = await fetch('/api/admin/lista-convidados/import', {
        method: 'POST',
        body: form,
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || 'Erro ao importar')
      const ignorados = data.skippedDuplicates ?? 0
      setMessage(
        ignorados > 0
          ? `${data.imported ?? 0} convidado(s) importado(s). ${ignorados} ignorado(s) (CPF já na lista).`
          : `${data.imported ?? 0} convidado(s) importado(s).`
      )
      await fetchList()
    } catch (err: any) {
      setError(err.message || 'Erro ao importar')
    } finally {
      setImporting(false)
      e.target.value = ''
    }
  }

  async function handleToggleEntrou(id: string, entrou: boolean) {
    try {
      const res = await fetch(`/api/admin/lista-convidados/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ entrou }),
      })
      if (!res.ok) throw new Error('Erro ao atualizar')
      setList((prev) =>
        prev.map((c) => (c.id === id ? { ...c, entrou } : c))
      )
    } catch (err: any) {
      setError(err.message || 'Erro ao marcar entrada')
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Excluir este convidado?')) return
    try {
      const res = await fetch(`/api/admin/lista-convidados/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Erro ao excluir')
      await fetchList()
    } catch (err: any) {
      setError(err.message || 'Erro ao excluir')
    }
  }

  function handleExportPDF() {
    if (list.length === 0) {
      setError('Não há convidados para exportar.')
      return
    }
    const rows = list
      .map(
        (c) =>
          `<tr><td>${c.entrou ? 'Sim' : 'Não'}</td><td>${escapeHtml(c.nomeCompleto)}</td><td>${formatCPF(c.cpf)}</td><td>${formatTel(c.telefone)}</td></tr>`
      )
      .join('')
    const data = new Date().toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Lista de Convidados - Portaria</title>
  <style>
    body { font-family: Arial, sans-serif; padding: 20px; color: #111; }
    h1 { font-size: 18px; margin-bottom: 4px; color: #1e3a5f; }
    .sub { font-size: 12px; color: #555; margin-bottom: 16px; }
    table { width: 100%; border-collapse: collapse; font-size: 11px; }
    th, td { border: 1px solid #333; padding: 8px 10px; text-align: left; }
    th { background: #1e3a5f; color: #fff; font-weight: bold; }
    tr:nth-child(even) { background: #f5f5f5; }
    @media print { body { padding: 10px; } }
  </style>
</head>
<body>
  <h1>Lista de Convidados – Equipe da Portaria</h1>
  <p class="sub">Gerado em ${data} &nbsp;|&nbsp; Total: ${list.length} convidado(s)</p>
  <table>
    <thead><tr><th>Entrou</th><th>Nome completo</th><th>CPF</th><th>Telefone</th></tr></thead>
    <tbody>${rows}</tbody>
  </table>
</body>
</html>`
    const w = window.open('', '_blank')
    if (!w) {
      setError('Permita pop-ups para abrir a impressão.')
      return
    }
    w.document.write(html)
    w.document.close()
    w.focus()
    setTimeout(() => {
      w.print()
      w.onafterprint = () => w.close()
    }, 300)
  }

  if (loading) {
    return (
      <div className="px-4 py-6">
        <p className="text-gray-600">Carregando lista...</p>
      </div>
    )
  }

  return (
    <div className="px-4 py-6" data-listaconvidados-version="com-ja-entrou">
      <div className="flex flex-wrap justify-between items-center gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold text-blue-900">Lista de Convidados</h1>
          <p className="text-sm text-green-700 font-medium mt-1">Confirmar entrada: marque quem já entrou na seção verde abaixo ou na coluna &quot;Já entrou?&quot; da tabela.</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={handleExportPDF}
            disabled={list.length === 0}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-semibold border border-red-700 disabled:opacity-50"
          >
            Exportar PDF para portaria
          </button>
          <button
            type="button"
            onClick={handleDownloadTemplate}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold border border-blue-700"
          >
            Baixar template CSV
          </button>
          <button
            type="button"
            onClick={triggerImport}
            disabled={importing}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-semibold border border-green-700 disabled:opacity-50"
          >
            {importing ? 'Importando...' : 'Importar CSV'}
          </button>
          <input
            id="import-csv"
            type="file"
            accept=".csv"
            className="hidden"
            onChange={handleImport}
          />
        </div>
      </div>

      {(message || error) && (
        <div className="mb-4">
          {message && (
            <div className="bg-green-50 border-2 border-green-200 text-green-800 px-4 py-3 rounded-lg">
              {message}
            </div>
          )}
          {error && (
            <div className="bg-red-50 border-2 border-red-200 text-red-700 px-4 py-3 rounded-lg mt-2">
              {error}
            </div>
          )}
        </div>
      )}

      <div className="mb-8 p-4 bg-gray-50 border-2 border-gray-200 rounded-xl">
        <h2 className="text-lg font-bold text-gray-900 mb-3">Adicionar convidado</h2>
        <form onSubmit={handleAdd} className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nome completo</label>
            <input
              type="text"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
              placeholder="Ex: Maria da Silva"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">CPF</label>
            <input
              type="text"
              value={cpf}
              onChange={(e) => setCpf(e.target.value.replace(/\D/g, '').slice(0, 11))}
              className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
              placeholder="Somente números"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Telefone</label>
            <input
              type="text"
              value={telefone}
              onChange={(e) => setTelefone(e.target.value.replace(/\D/g, '').slice(0, 11))}
              className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
              placeholder="Somente números"
            />
          </div>
          <div className="md:col-span-3">
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2 bg-gradient-to-r from-green-600 to-blue-900 text-white rounded-lg hover:from-green-700 hover:to-blue-950 font-semibold disabled:opacity-50"
            >
              {saving ? 'Salvando...' : 'Adicionar'}
            </button>
          </div>
        </form>
      </div>

      <div className="mb-6 p-5 rounded-xl border-2 border-green-400 bg-green-50 shadow-sm" data-secao="ja-entrou">
        <h2 className="text-lg font-bold text-green-900 mb-1">Quem já entrou?</h2>
        <p className="text-sm text-green-800 mb-4">Marque o checkbox quando o convidado confirmar a entrada.</p>
        {list.length === 0 ? (
          <p className="text-sm text-green-700 italic">Quando houver convidados, os checkboxes aparecerão aqui.</p>
        ) : (
          <div className="flex flex-wrap gap-x-6 gap-y-3">
            {list.map((c) => (
              <label
                key={c.id}
                className="inline-flex items-center gap-2 cursor-pointer bg-white px-4 py-2 rounded-lg border-2 border-green-300 hover:border-green-500 hover:bg-green-50/50"
              >
                <input
                  type="checkbox"
                  checked={Boolean(c.entrou)}
                  onChange={() => handleToggleEntrou(c.id, !c.entrou)}
                  className="w-5 h-5 rounded border-2 border-gray-400 text-green-600 focus:ring-2 focus:ring-green-500 cursor-pointer"
                />
                <span className="text-sm font-medium text-gray-800">{c.nomeCompleto}</span>
                {c.entrou && <span className="text-xs text-green-700 font-semibold">(entrou)</span>}
              </label>
            ))}
          </div>
        )}
      </div>

      <div className="rounded-xl border-2 border-gray-200 overflow-visible">
        <div className="bg-gray-100 px-4 py-3 border-b border-gray-200">
          <p className="text-sm font-semibold text-gray-800">
            Total: {list.length} convidado(s)
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200" style={{ tableLayout: 'auto' }}>
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700 uppercase whitespace-nowrap w-44 bg-green-200 border-r-2 border-green-400 sticky left-0 z-10 shadow-[2px_0_4px_rgba(0,0,0,0.06)]">
                  Já entrou?
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                  Nome completo
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                  CPF
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                  Telefone
                </th>
                <th className="px-4 py-3 w-24"></th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {list.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                    Nenhum convidado ainda. Adicione manualmente ou importe um CSV.
                  </td>
                </tr>
              ) : (
                list.map((c) => (
                  <tr key={c.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-center bg-green-100 border-r-2 border-green-300 w-44 sticky left-0 z-10 shadow-[2px_0_4px_rgba(0,0,0,0.06)]">
                      <label className="inline-flex items-center justify-center gap-2 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={Boolean(c.entrou)}
                          onChange={() => handleToggleEntrou(c.id, !c.entrou)}
                          className="w-5 h-5 rounded border-2 border-gray-400 text-green-600 focus:ring-2 focus:ring-green-500 cursor-pointer"
                          title="Marcar se o convidado já entrou"
                        />
                        <span className="text-sm font-medium text-gray-700">
                          {c.entrou ? 'Sim' : 'Não'}
                        </span>
                      </label>
                    </td>
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">
                      {c.nomeCompleto}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">
                      {formatCPF(c.cpf)}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">
                      {formatTel(c.telefone)}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        type="button"
                        onClick={() => handleDelete(c.id)}
                        className="text-red-600 hover:text-red-800 text-sm font-semibold"
                      >
                        Excluir
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg space-y-2">
        <p className="text-sm text-blue-800">
          <strong>Como usar o template:</strong> Clique em &quot;Baixar template CSV&quot;, envie o arquivo para a pessoa preencher (Nome completo, CPF, Telefone). Depois use &quot;Importar CSV&quot; para carregar os dados aqui.
        </p>
        <p className="text-sm text-blue-800">
          <strong>Exportar para a portaria:</strong> Use &quot;Exportar PDF para portaria&quot;. Abre a lista formatada para impressão; na janela de impressão escolha &quot;Salvar como PDF&quot; e envie o arquivo para a equipe da portaria.
        </p>
      </div>
    </div>
  )
}
