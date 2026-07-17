"use client";

import { Building2, Globe, MapPin, Plus, Search } from "lucide-react";
import { useState } from "react";
import { createCompany } from "@/server/actions/companies";

type Company = {
  id: string;
  tradeName: string;
  legalName: string | null;
  documentNumber: string | null;
  email: string | null;
  phone: string | null;
  website: string | null;
  city: string | null;
  state: string | null;
  createdAt: Date;
};

export function CompaniesClient({ initialCompanies }: { initialCompanies: Company[] }) {
  const [companies, setCompanies] = useState(initialCompanies);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);

  const filtered = companies.filter((c) =>
    c.tradeName.toLowerCase().includes(search.toLowerCase()),
  );

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    const tradeName = formData.get("tradeName") as string;
    const documentNumber = formData.get("documentNumber") as string;
    const email = formData.get("email") as string;
    const phone = formData.get("phone") as string;
    const website = formData.get("website") as string;

    try {
      const newCompany = await createCompany({
        tradeName,
        documentNumber,
        email,
        phone,
        website,
      });
      setCompanies([newCompany, ...companies]);
      setIsModalOpen(false);
      (e.target as HTMLFormElement).reset();
    } catch (err) {
      console.error(err);
      alert("Erro ao criar empresa.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="p-4 md:p-8 flex flex-col h-full max-w-7xl mx-auto w-full">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Building2 size={24} className="text-orange-600" />
            Empresas
          </h1>
          <p className="text-slate-500 mt-1">Gerencie as empresas e clientes da sua carteira.</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 bg-orange-600 text-white px-4 py-2 rounded-md hover:bg-orange-700 transition-colors w-full sm:w-auto justify-center"
        >
          <Plus size={20} />
          Nova Empresa
        </button>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden flex flex-col">
        <div className="p-4 border-b border-slate-100 bg-slate-50">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="text"
              placeholder="Buscar por nome fantasia..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-md focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr className="bg-slate-50 text-slate-500 text-sm border-b border-slate-200">
                <th className="p-4 font-medium">Nome Fantasia</th>
                <th className="p-4 font-medium">CNPJ / Documento</th>
                <th className="p-4 font-medium">Contato</th>
                <th className="p-4 font-medium">Localização</th>
                <th className="p-4 font-medium text-right">Data de Cadastro</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-slate-500">
                    Nenhuma empresa encontrada.
                  </td>
                </tr>
              ) : (
                filtered.map((company) => (
                  <tr
                    key={company.id}
                    className="border-b border-slate-100 hover:bg-slate-50 transition-colors"
                  >
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 font-bold shrink-0">
                          {company.tradeName.substring(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-semibold text-slate-900">{company.tradeName}</p>
                          {company.website && (
                            <a
                              href={
                                company.website.startsWith("http")
                                  ? company.website
                                  : `https://${company.website}`
                              }
                              target="_blank"
                              rel="noreferrer"
                              className="text-xs text-slate-500 flex items-center gap-1 hover:text-orange-600"
                            >
                              <Globe size={12} /> {company.website.replace(/^https?:\/\//, "")}
                            </a>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="p-4 text-slate-600">{company.documentNumber || "-"}</td>
                    <td className="p-4 text-slate-600">
                      <p className="text-sm">{company.email || "Sem e-mail"}</p>
                      <p className="text-sm text-slate-400">{company.phone || "Sem telefone"}</p>
                    </td>
                    <td className="p-4 text-slate-600">
                      <span className="flex items-center gap-1 text-sm">
                        <MapPin size={14} className="text-slate-400" />
                        {company.city ? `${company.city} - ${company.state}` : "Não informado"}
                      </span>
                    </td>
                    <td className="p-4 text-slate-500 text-right text-sm">
                      {new Date(company.createdAt).toLocaleDateString("pt-BR")}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-slate-100">
              <h2 className="text-xl font-bold text-slate-900">Nova Empresa</h2>
              <p className="text-slate-500 text-sm mt-1">
                Preencha os dados da organização parceira.
              </p>
            </div>

            <div className="p-6 overflow-y-auto">
              <form id="companyForm" onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Nome Fantasia *
                  </label>
                  <input
                    name="tradeName"
                    required
                    className="w-full px-3 py-2 border border-slate-300 rounded-md focus:border-orange-500 focus:ring-1 focus:ring-orange-500 outline-none"
                    placeholder="Ex: Pulso Cloud"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    CNPJ / CPF
                  </label>
                  <input
                    name="documentNumber"
                    className="w-full px-3 py-2 border border-slate-300 rounded-md focus:border-orange-500 focus:ring-1 focus:ring-orange-500 outline-none"
                    placeholder="Apenas números"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">E-mail</label>
                    <input
                      name="email"
                      type="email"
                      className="w-full px-3 py-2 border border-slate-300 rounded-md focus:border-orange-500 focus:ring-1 focus:ring-orange-500 outline-none"
                      placeholder="contato@..."
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Telefone
                    </label>
                    <input
                      name="phone"
                      className="w-full px-3 py-2 border border-slate-300 rounded-md focus:border-orange-500 focus:ring-1 focus:ring-orange-500 outline-none"
                      placeholder="(11) 90000-0000"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Website</label>
                  <input
                    name="website"
                    className="w-full px-3 py-2 border border-slate-300 rounded-md focus:border-orange-500 focus:ring-1 focus:ring-orange-500 outline-none"
                    placeholder="https://..."
                  />
                </div>
              </form>
            </div>

            <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end gap-3 shrink-0">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 text-slate-700 hover:bg-slate-200 rounded-md transition-colors"
                disabled={loading}
              >
                Cancelar
              </button>
              <button
                type="submit"
                form="companyForm"
                disabled={loading}
                className="px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 transition-colors disabled:opacity-50 flex items-center justify-center min-w-[100px]"
              >
                {loading ? "Salvando..." : "Salvar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
