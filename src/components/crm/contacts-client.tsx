"use client";

import { Briefcase, Building2, Contact, Mail, Pencil, Phone, Plus, Search, Trash2 } from "lucide-react";
import { useState } from "react";
import {
  createContact,
  deleteContact,
  getDeletedContacts,
  restoreContact,
  updateContact,
} from "@/server/actions/contacts";

type ContactType = {
  id: string;
  firstName: string;
  lastName: string | null;
  email: string | null;
  phone: string | null;
  whatsapp: string | null;
  jobTitle: string | null;
  createdAt: Date;
  companyId: string | null;
  companyName: string | null;
};

type DeletedContact = {
  id: string;
  firstName: string;
  lastName: string | null;
  deletedAt: Date | null;
};

type CompanyOption = { id: string; tradeName: string };

export function ContactsClient({
  initialContacts,
  companies,
}: {
  initialContacts: ContactType[];
  companies: CompanyOption[];
}) {
  const [contacts, setContacts] = useState(initialContacts);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingContact, setEditingContact] = useState<ContactType | null>(null);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [showDeleted, setShowDeleted] = useState(false);
  const [deletedContacts, setDeletedContacts] = useState<DeletedContact[] | null>(null);
  const [loadingDeleted, setLoadingDeleted] = useState(false);

  async function toggleShowDeleted() {
    const next = !showDeleted;
    setShowDeleted(next);
    if (next && deletedContacts === null) {
      setLoadingDeleted(true);
      try {
        setDeletedContacts(await getDeletedContacts());
      } catch (err) {
        console.error(err);
        alert("Erro ao carregar contatos excluídos.");
      } finally {
        setLoadingDeleted(false);
      }
    }
  }

  async function handleRestore(contact: DeletedContact) {
    try {
      await restoreContact(contact.id);
      setDeletedContacts((prev) => prev?.filter((c) => c.id !== contact.id) ?? null);
      window.location.reload();
    } catch (err) {
      console.error(err);
      alert("Erro ao restaurar contato.");
    }
  }

  const filtered = contacts.filter((c) =>
    `${c.firstName} ${c.lastName || ""}`.toLowerCase().includes(search.toLowerCase()),
  );

  function openCreateModal() {
    setEditingContact(null);
    setIsModalOpen(true);
  }

  function openEditModal(contact: ContactType) {
    setEditingContact(contact);
    setIsModalOpen(true);
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    const firstName = formData.get("firstName") as string;
    const lastName = formData.get("lastName") as string;
    const email = formData.get("email") as string;
    const phone = formData.get("phone") as string;
    const whatsapp = formData.get("whatsapp") as string;
    const jobTitle = formData.get("jobTitle") as string;
    const companyId = formData.get("companyId") as string;

    try {
      if (editingContact) {
        const result = await updateContact(editingContact.id, {
          firstName,
          lastName,
          email,
          phone,
          whatsapp,
          jobTitle,
          companyId,
        });
        setContacts(
          contacts.map((c) =>
            c.id === editingContact.id
              ? {
                  ...c,
                  firstName,
                  lastName,
                  email,
                  phone,
                  whatsapp,
                  jobTitle,
                  companyId: result.companyId,
                  companyName: result.companyName,
                }
              : c,
          ),
        );
      } else {
        const newContact = await createContact({
          firstName,
          lastName,
          email,
          phone,
          whatsapp,
          jobTitle,
          companyId: companyId || undefined,
        });
        setContacts([newContact, ...contacts]);
      }
      setIsModalOpen(false);
      setEditingContact(null);
      (e.target as HTMLFormElement).reset();
    } catch (err) {
      console.error(err);
      alert(editingContact ? "Erro ao salvar contato." : "Erro ao criar contato.");
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(contact: ContactType) {
    if (!window.confirm(`Excluir o contato "${contact.firstName} ${contact.lastName ?? ""}"?`)) {
      return;
    }
    try {
      await deleteContact(contact.id);
      setContacts(contacts.filter((c) => c.id !== contact.id));
    } catch (err) {
      console.error(err);
      alert("Erro ao excluir contato.");
    }
  }

  return (
    <div className="p-4 md:p-8 flex flex-col h-full max-w-7xl mx-auto w-full">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Contact size={24} className="text-orange-600" />
            Contatos
          </h1>
          <p className="text-slate-500 mt-1">Gerencie pessoas e leads da sua carteira.</p>
        </div>
        <button
          type="button"
          onClick={openCreateModal}
          className="flex items-center gap-2 bg-orange-600 text-white px-4 py-2 rounded-md hover:bg-orange-700 transition-colors w-full sm:w-auto justify-center"
        >
          <Plus size={20} />
          Novo Contato
        </button>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden flex flex-col">
        <div className="p-4 border-b border-slate-100 bg-slate-50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="relative max-w-md w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="text"
              placeholder="Buscar por nome..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-md focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
            />
          </div>
          <button
            type="button"
            onClick={toggleShowDeleted}
            className="text-sm text-slate-500 hover:text-slate-700 underline shrink-0"
          >
            {showDeleted ? "Ocultar excluídos" : "Ver excluídos"}
          </button>
        </div>

        {showDeleted && (
          <div className="p-4 border-b border-slate-100 bg-slate-50">
            {loadingDeleted ? (
              <p className="text-sm text-slate-500">Carregando...</p>
            ) : deletedContacts && deletedContacts.length > 0 ? (
              <ul className="space-y-2">
                {deletedContacts.map((c) => (
                  <li key={c.id} className="flex items-center justify-between text-sm">
                    <span>
                      {c.firstName} {c.lastName ?? ""}
                    </span>
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
              <p className="text-sm text-slate-500">Nenhum contato excluído.</p>
            )}
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr className="bg-slate-50 text-slate-500 text-sm border-b border-slate-200">
                <th className="p-4 font-medium">Nome Completo</th>
                <th className="p-4 font-medium">Empresa</th>
                <th className="p-4 font-medium">Cargo</th>
                <th className="p-4 font-medium">E-mail</th>
                <th className="p-4 font-medium">WhatsApp / Telefone</th>
                <th className="p-4 font-medium text-right">Data de Cadastro</th>
                <th className="p-4 font-medium text-right">Ações</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-500">
                    Nenhum contato encontrado.
                  </td>
                </tr>
              ) : (
                filtered.map((contact) => (
                  <tr
                    key={contact.id}
                    className="border-b border-slate-100 hover:bg-slate-50 transition-colors"
                  >
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 font-bold shrink-0">
                          {contact.firstName.substring(0, 1).toUpperCase()}
                          {contact.lastName ? contact.lastName.substring(0, 1).toUpperCase() : ""}
                        </div>
                        <div>
                          <p className="font-semibold text-slate-900">
                            {contact.firstName} {contact.lastName}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4 text-slate-600">
                      {contact.companyName ? (
                        <span className="flex items-center gap-1 text-sm">
                          <Building2 size={14} className="text-slate-400" />
                          {contact.companyName}
                        </span>
                      ) : (
                        "-"
                      )}
                    </td>
                    <td className="p-4 text-slate-600">
                      {contact.jobTitle ? (
                        <span className="flex items-center gap-1 text-sm">
                          <Briefcase size={14} className="text-slate-400" />
                          {contact.jobTitle}
                        </span>
                      ) : (
                        "-"
                      )}
                    </td>
                    <td className="p-4 text-slate-600">
                      {contact.email ? (
                        <span className="flex items-center gap-1 text-sm">
                          <Mail size={14} className="text-slate-400" />
                          {contact.email}
                        </span>
                      ) : (
                        "-"
                      )}
                    </td>
                    <td className="p-4 text-slate-600">
                      <span className="flex items-center gap-1 text-sm">
                        <Phone size={14} className="text-slate-400" />
                        {contact.whatsapp || contact.phone || "-"}
                      </span>
                    </td>
                    <td className="p-4 text-slate-500 text-right text-sm">
                      {new Date(contact.createdAt).toLocaleDateString("pt-BR")}
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => openEditModal(contact)}
                          title="Editar"
                          className="p-2 text-slate-400 hover:text-orange-600 hover:bg-orange-50 rounded-md transition-colors"
                        >
                          <Pencil size={16} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(contact)}
                          title="Excluir"
                          className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
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
              <h2 className="text-xl font-bold text-slate-900">
                {editingContact ? "Editar Contato" : "Novo Contato"}
              </h2>
              <p className="text-slate-500 text-sm mt-1">
                {editingContact ? "Atualize os dados desta pessoa." : "Cadastre uma nova pessoa."}
              </p>
            </div>

            <div className="p-6 overflow-y-auto">
              <form
                id="contactForm"
                key={editingContact?.id ?? "new"}
                onSubmit={handleSubmit}
                className="space-y-4"
              >
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label
                      htmlFor="contact-firstName"
                      className="block text-sm font-medium text-slate-700 mb-1"
                    >
                      Nome *
                    </label>
                    <input
                      id="contact-firstName"
                      name="firstName"
                      required
                      defaultValue={editingContact?.firstName}
                      className="w-full px-3 py-2 border border-slate-300 rounded-md focus:border-orange-500 focus:ring-1 focus:ring-orange-500 outline-none"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="contact-lastName"
                      className="block text-sm font-medium text-slate-700 mb-1"
                    >
                      Sobrenome
                    </label>
                    <input
                      id="contact-lastName"
                      name="lastName"
                      defaultValue={editingContact?.lastName ?? undefined}
                      className="w-full px-3 py-2 border border-slate-300 rounded-md focus:border-orange-500 focus:ring-1 focus:ring-orange-500 outline-none"
                    />
                  </div>
                </div>
                <div>
                  <label
                    htmlFor="contact-email"
                    className="block text-sm font-medium text-slate-700 mb-1"
                  >
                    E-mail
                  </label>
                  <input
                    id="contact-email"
                    name="email"
                    type="email"
                    defaultValue={editingContact?.email ?? undefined}
                    className="w-full px-3 py-2 border border-slate-300 rounded-md focus:border-orange-500 focus:ring-1 focus:ring-orange-500 outline-none"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label
                      htmlFor="contact-whatsapp"
                      className="block text-sm font-medium text-slate-700 mb-1"
                    >
                      WhatsApp
                    </label>
                    <input
                      id="contact-whatsapp"
                      name="whatsapp"
                      defaultValue={editingContact?.whatsapp ?? undefined}
                      className="w-full px-3 py-2 border border-slate-300 rounded-md focus:border-orange-500 focus:ring-1 focus:ring-orange-500 outline-none"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="contact-phone"
                      className="block text-sm font-medium text-slate-700 mb-1"
                    >
                      Outro Telefone
                    </label>
                    <input
                      id="contact-phone"
                      name="phone"
                      defaultValue={editingContact?.phone ?? undefined}
                      className="w-full px-3 py-2 border border-slate-300 rounded-md focus:border-orange-500 focus:ring-1 focus:ring-orange-500 outline-none"
                    />
                  </div>
                </div>
                <div>
                  <label
                    htmlFor="contact-jobTitle"
                    className="block text-sm font-medium text-slate-700 mb-1"
                  >
                    Cargo / Ocupação
                  </label>
                  <input
                    id="contact-jobTitle"
                    name="jobTitle"
                    defaultValue={editingContact?.jobTitle ?? undefined}
                    className="w-full px-3 py-2 border border-slate-300 rounded-md focus:border-orange-500 focus:ring-1 focus:ring-orange-500 outline-none"
                  />
                </div>
                <div>
                  <label
                    htmlFor="contact-companyId"
                    className="block text-sm font-medium text-slate-700 mb-1"
                  >
                    Empresa vinculada
                  </label>
                  <select
                    id="contact-companyId"
                    name="companyId"
                    defaultValue={editingContact?.companyId ?? ""}
                    className="w-full px-3 py-2 border border-slate-300 rounded-md bg-white focus:border-orange-500 focus:ring-1 focus:ring-orange-500 outline-none"
                  >
                    <option value="">-- Nenhuma --</option>
                    {companies.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.tradeName}
                      </option>
                    ))}
                  </select>
                </div>
              </form>
            </div>

            <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end gap-3 shrink-0">
              <button
                type="button"
                onClick={() => {
                  setIsModalOpen(false);
                  setEditingContact(null);
                }}
                className="px-4 py-2 text-slate-700 hover:bg-slate-200 rounded-md transition-colors"
                disabled={loading}
              >
                Cancelar
              </button>
              <button
                type="submit"
                form="contactForm"
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
