"use client";

import {
  Briefcase,
  Building2,
  Contact,
  Mail,
  Pencil,
  Phone,
  Plus,
  Search,
  Trash2,
} from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { Select } from "@/components/ui/select";
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

  function closeModal() {
    setIsModalOpen(false);
    setEditingContact(null);
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
        <Button onClick={openCreateModal} className="w-full sm:w-auto">
          <Plus size={20} />
          Novo Contato
        </Button>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden flex flex-col">
        <div className="p-4 border-b border-slate-100 bg-slate-50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="relative max-w-md w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <Input
              type="text"
              placeholder="Buscar por nome..."
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
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openEditModal(contact)}
                          title="Editar"
                          className="text-slate-400 hover:text-orange-600 hover:bg-orange-50"
                        >
                          <Pencil size={16} />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(contact)}
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
        onClose={closeModal}
        title={editingContact ? "Editar Contato" : "Novo Contato"}
        description={
          editingContact ? "Atualize os dados desta pessoa." : "Cadastre uma nova pessoa."
        }
      >
        <form
          id="contactForm"
          key={editingContact?.id ?? "new"}
          onSubmit={handleSubmit}
          className="space-y-4"
        >
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="contact-firstName" className="block text-sm font-medium mb-1">
                Nome *
              </label>
              <Input
                id="contact-firstName"
                name="firstName"
                required
                defaultValue={editingContact?.firstName}
              />
            </div>
            <div>
              <label htmlFor="contact-lastName" className="block text-sm font-medium mb-1">
                Sobrenome
              </label>
              <Input
                id="contact-lastName"
                name="lastName"
                defaultValue={editingContact?.lastName ?? undefined}
              />
            </div>
          </div>
          <div>
            <label htmlFor="contact-email" className="block text-sm font-medium mb-1">
              E-mail
            </label>
            <Input
              id="contact-email"
              name="email"
              type="email"
              defaultValue={editingContact?.email ?? undefined}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="contact-whatsapp" className="block text-sm font-medium mb-1">
                WhatsApp
              </label>
              <Input
                id="contact-whatsapp"
                name="whatsapp"
                defaultValue={editingContact?.whatsapp ?? undefined}
              />
            </div>
            <div>
              <label htmlFor="contact-phone" className="block text-sm font-medium mb-1">
                Outro Telefone
              </label>
              <Input
                id="contact-phone"
                name="phone"
                defaultValue={editingContact?.phone ?? undefined}
              />
            </div>
          </div>
          <div>
            <label htmlFor="contact-jobTitle" className="block text-sm font-medium mb-1">
              Cargo / Ocupação
            </label>
            <Input
              id="contact-jobTitle"
              name="jobTitle"
              defaultValue={editingContact?.jobTitle ?? undefined}
            />
          </div>
          <div>
            <label htmlFor="contact-companyId" className="block text-sm font-medium mb-1">
              Empresa vinculada
            </label>
            <Select
              id="contact-companyId"
              name="companyId"
              defaultValue={editingContact?.companyId ?? ""}
            >
              <option value="">-- Nenhuma --</option>
              {companies.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.tradeName}
                </option>
              ))}
            </Select>
          </div>

          <div className="pt-2 flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={closeModal} disabled={loading}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading} className="min-w-[100px]">
              {loading ? "Salvando..." : "Salvar"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
