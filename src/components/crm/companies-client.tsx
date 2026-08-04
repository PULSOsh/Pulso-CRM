"use client";

import { Building2, Globe, MapPin, Pencil, Plus, Search, Trash2, Upload } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import {
  createCompany,
  deleteCompany,
  getDeletedCompanies,
  importCompanies,
  restoreCompany,
  updateCompany,
} from "@/server/actions/companies";
import { ImportCsvModal } from "./import-csv-modal";

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

type DeletedCompany = { id: string; tradeName: string; deletedAt: Date | null };

export function CompaniesClient({ initialCompanies }: { initialCompanies: Company[] }) {
  const [companies, setCompanies] = useState(initialCompanies);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCompany, setEditingCompany] = useState<Company | null>(null);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [showDeleted, setShowDeleted] = useState(false);
  const [deletedCompanies, setDeletedCompanies] = useState<DeletedCompany[] | null>(null);
  const [loadingDeleted, setLoadingDeleted] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);

  const filtered = companies.filter((c) =>
    c.tradeName.toLowerCase().includes(search.toLowerCase()),
  );

  async function toggleShowDeleted() {
    const next = !showDeleted;
    setShowDeleted(next);
    if (next && deletedCompanies === null) {
      setLoadingDeleted(true);
      try {
        setDeletedCompanies(await getDeletedCompanies());
      } catch (err) {
        console.error(err);
        alert("Erro ao carregar empresas excluídas.");
      } finally {
        setLoadingDeleted(false);
      }
    }
  }

  async function handleRestore(company: DeletedCompany) {
    try {
      await restoreCompany(company.id);
      setDeletedCompanies((prev) => prev?.filter((c) => c.id !== company.id) ?? null);
      window.location.reload();
    } catch (err) {
      console.error(err);
      alert("Erro ao restaurar empresa.");
    }
  }

  function openCreateModal() {
    setEditingCompany(null);
    setIsModalOpen(true);
  }

  function openEditModal(company: Company) {
    setEditingCompany(company);
    setIsModalOpen(true);
  }

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
      if (editingCompany) {
        await updateCompany(editingCompany.id, {
          tradeName,
          documentNumber,
          email,
          phone,
          website,
        });
        setCompanies(
          companies.map((c) =>
            c.id === editingCompany.id
              ? { ...c, tradeName, documentNumber, email, phone, website }
              : c,
          ),
        );
      } else {
        const newCompany = await createCompany({
          tradeName,
          documentNumber,
          email,
          phone,
          website,
        });
        setCompanies([newCompany, ...companies]);
      }
      setIsModalOpen(false);
      setEditingCompany(null);
      (e.target as HTMLFormElement).reset();
    } catch (err) {
      console.error(err);
      alert(editingCompany ? "Erro ao salvar empresa." : "Erro ao criar empresa.");
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(company: Company) {
    if (!window.confirm(`Excluir a empresa "${company.tradeName}"?`)) {
      return;
    }
    try {
      await deleteCompany(company.id);
      setCompanies(companies.filter((c) => c.id !== company.id));
    } catch (err) {
      console.error(err);
      alert("Erro ao excluir empresa.");
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
        <div className="flex gap-2 w-full sm:w-auto">
          <Button variant="outline" onClick={() => setIsImportOpen(true)}>
            <Upload size={18} />
            Importar CSV
          </Button>
          <Button onClick={openCreateModal} className="w-full sm:w-auto">
            <Plus size={20} />
            Nova Empresa
          </Button>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden flex flex-col">
        <div className="p-4 border-b border-slate-100 bg-slate-50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="relative max-w-md w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <Input
              type="text"
              placeholder="Buscar por nome fantasia..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          <button
            type="button"
            onClick={toggleShowDeleted}
            className="text-sm text-slate-500 hover:text-slate-700 underline shrink-0"
          >
            {showDeleted ? "Ocultar excluídas" : "Ver excluídas"}
          </button>
        </div>

        {showDeleted && (
          <div className="p-4 border-b border-slate-100 bg-slate-50">
            {loadingDeleted ? (
              <p className="text-sm text-slate-500">Carregando...</p>
            ) : deletedCompanies && deletedCompanies.length > 0 ? (
              <ul className="space-y-2">
                {deletedCompanies.map((c) => (
                  <li key={c.id} className="flex items-center justify-between text-sm">
                    <span>{c.tradeName}</span>
                    <button
                      type="button"
                      onClick={() => handleRestore(c)}
                      className="text-orange-600 hover:underline font-medium"
                    >
                      Restaurar
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-slate-500">Nenhuma empresa excluída.</p>
            )}
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr className="bg-slate-50 text-slate-500 text-sm border-b border-slate-200">
                <th className="p-4 font-medium">Nome Fantasia</th>
                <th className="p-4 font-medium">CNPJ / Documento</th>
                <th className="p-4 font-medium">Contato</th>
                <th className="p-4 font-medium">Localização</th>
                <th className="p-4 font-medium text-right">Data de Cadastro</th>
                <th className="p-4 font-medium text-right">Ações</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-500">
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
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openEditModal(company)}
                          title="Editar"
                          className="text-slate-400 hover:text-orange-600 hover:bg-orange-50"
                        >
                          <Pencil size={16} />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(company)}
                          title="Excluir"
                          className="text-slate-400 hover:text-red-600 hover:bg-red-50"
                        >
                          <Trash2 size={16} />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Modal
        open={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingCompany(null);
        }}
        title={editingCompany ? "Editar Empresa" : "Nova Empresa"}
        description={
          editingCompany
            ? "Atualize os dados desta organização."
            : "Preencha os dados da organização parceira."
        }
      >
        <form
          id="companyForm"
          key={editingCompany?.id ?? "new"}
          onSubmit={handleSubmit}
          className="space-y-4"
        >
          <div>
            <label htmlFor="company-tradeName" className="block text-sm font-medium mb-1">
              Nome Fantasia *
            </label>
            <Input
              id="company-tradeName"
              name="tradeName"
              required
              defaultValue={editingCompany?.tradeName}
              placeholder="Ex: Pulso Cloud"
            />
          </div>
          <div>
            <label htmlFor="company-documentNumber" className="block text-sm font-medium mb-1">
              CNPJ / CPF
            </label>
            <Input
              id="company-documentNumber"
              name="documentNumber"
              defaultValue={editingCompany?.documentNumber ?? undefined}
              placeholder="Apenas números"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="company-email" className="block text-sm font-medium mb-1">
                E-mail
              </label>
              <Input
                id="company-email"
                name="email"
                type="email"
                defaultValue={editingCompany?.email ?? undefined}
                placeholder="contato@..."
              />
            </div>
            <div>
              <label htmlFor="company-phone" className="block text-sm font-medium mb-1">
                Telefone
              </label>
              <Input
                id="company-phone"
                name="phone"
                defaultValue={editingCompany?.phone ?? undefined}
                placeholder="(11) 90000-0000"
              />
            </div>
          </div>
          <div>
            <label htmlFor="company-website" className="block text-sm font-medium mb-1">
              Website
            </label>
            <Input
              id="company-website"
              name="website"
              defaultValue={editingCompany?.website ?? undefined}
              placeholder="https://..."
            />
          </div>

          <div className="pt-2 flex justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setIsModalOpen(false);
                setEditingCompany(null);
              }}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={loading} className="min-w-[100px]">
              {loading ? "Salvando..." : "Salvar"}
            </Button>
          </div>
        </form>
      </Modal>

      <ImportCsvModal
        open={isImportOpen}
        onClose={() => setIsImportOpen(false)}
        title="Importar Empresas"
        headerExample="nomeFantasia,razaoSocial,cnpj,email,telefone,site"
        onImport={importCompanies}
        onImported={() => window.location.reload()}
      />
    </div>
  );
}
