"use client";

import { Briefcase, Contact, Mail, Phone, Plus, Search } from "lucide-react";
import { useState } from "react";
import { createContact } from "@/server/actions/contacts";

type ContactType = {
  id: string;
  firstName: string;
  lastName: string | null;
  email: string | null;
  phone: string | null;
  whatsapp: string | null;
  jobTitle: string | null;
  createdAt: Date;
};

export function ContactsClient({ initialContacts }: { initialContacts: ContactType[] }) {
  const [contacts, setContacts] = useState(initialContacts);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);

  const filtered = contacts.filter((c) =>
    `${c.firstName} ${c.lastName || ""}`.toLowerCase().includes(search.toLowerCase()),
  );

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

    try {
      const newContact = await createContact({
        firstName,
        lastName,
        email,
        phone,
        whatsapp,
        jobTitle,
      });
      setContacts([newContact, ...contacts]);
      setIsModalOpen(false);
      (e.target as HTMLFormElement).reset();
    } catch (err) {
      console.error(err);
      alert("Erro ao criar contato.");
    } finally {
      setLoading(false);
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
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 bg-orange-600 text-white px-4 py-2 rounded-md hover:bg-orange-700 transition-colors w-full sm:w-auto justify-center"
        >
          <Plus size={20} />
          Novo Contato
        </button>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden flex flex-col">
        <div className="p-4 border-b border-slate-100 bg-slate-50">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="text"
              placeholder="Buscar por nome..."
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
                <th className="p-4 font-medium">Nome Completo</th>
                <th className="p-4 font-medium">Cargo</th>
                <th className="p-4 font-medium">E-mail</th>
                <th className="p-4 font-medium">WhatsApp / Telefone</th>
                <th className="p-4 font-medium text-right">Data de Cadastro</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-slate-500">
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
              <h2 className="text-xl font-bold text-slate-900">Novo Contato</h2>
              <p className="text-slate-500 text-sm mt-1">Cadastre uma nova pessoa.</p>
            </div>

            <div className="p-6 overflow-y-auto">
              <form id="contactForm" onSubmit={handleSubmit} className="space-y-4">
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
                    className="w-full px-3 py-2 border border-slate-300 rounded-md focus:border-orange-500 focus:ring-1 focus:ring-orange-500 outline-none"
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
