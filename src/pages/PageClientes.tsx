import { useState, useEffect, useCallback } from "react";
import { getCustomers, createCustomer, updateCustomer, deleteCustomer } from "../lib/storage";
import { fmtDate } from "../lib/helpers";
import type { Customer } from "../types";
import type { ToastType } from "../hooks/useToast";
import Modal from "../components/Modal";
import InputGroup from "../components/InputGroup";
import EmptyState from "../components/EmptyState";

interface Props {
  showToast: (msg: string, type?: ToastType) => void;
}

export default function PageClientes({ showToast }: Props) {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editId,    setEditId]    = useState<string | null>(null);
  const [saving,    setSaving]    = useState(false);
  const [form, setForm] = useState({ name: "", email: "", phone: "" });

  const load = useCallback(async () => {
    try { setCustomers(await getCustomers()); }
    catch (e: unknown) { showToast((e as Error).message, "error"); }
  }, [showToast]);

  useEffect(() => { load(); }, [load]);

  const openNew = () => {
    setEditId(null); setForm({ name: "", email: "", phone: "" }); setModalOpen(true);
  };
  const openEdit = (c: Customer) => {
    setEditId(c.id);
    setForm({ name: c.name, email: c.email || "", phone: c.phone || "" });
    setModalOpen(true);
  };
  const save = async () => {
    if (!form.name.trim()) return showToast("Informe o nome do cliente.", "error");
    setSaving(true);
    try {
      if (editId) { await updateCustomer(editId, form); showToast("Cliente atualizado!", "success"); }
      else        { await createCustomer(form);          showToast("Cliente cadastrado!", "success"); }
      setModalOpen(false); load();
    } catch (e: unknown) { showToast((e as Error).message, "error"); }
    finally { setSaving(false); }
  };
  const remove = async (id: string) => {
    if (!window.confirm("Remover este cliente?")) return;
    try { await deleteCustomer(id); showToast("Cliente removido.", "info"); load(); }
    catch (e: unknown) { showToast((e as Error).message, "error"); }
  };

  return (
    <section className="page active">
      <div className="page-header">
        <h2>Clientes</h2><p>Cadastro de clientes recorrentes</p>
        <button className="btn btn-primary" onClick={openNew}>+ Novo Cliente</button>
      </div>
      <div className="table-wrapper">
        <table className="data-table">
          <thead><tr><th>Nome</th><th>E-mail</th><th>Telefone</th><th>Cadastrado em</th><th>Ações</th></tr></thead>
          <tbody>
            {customers.length === 0
              ? <tr><td colSpan={5}><EmptyState msg="Nenhum cliente cadastrado." /></td></tr>
              : customers.map(c => (
                <tr key={c.id}>
                  <td><strong>{c.name}</strong></td>
                  <td>{c.email || "—"}</td>
                  <td>{c.phone || "—"}</td>
                  <td>{fmtDate(c.createdAt)}</td>
                  <td>
                    <div className="actions">
                      <button className="btn btn-sm btn-outline" onClick={() => openEdit(c)}>Editar</button>
                      <button className="btn btn-sm btn-danger"  onClick={() => remove(c.id)}>Remover</button>
                    </div>
                  </td>
                </tr>
              ))
            }
          </tbody>
        </table>
      </div>
      <Modal open={modalOpen} onClose={() => setModalOpen(false)}
        title={editId ? "Editar Cliente" : "Novo Cliente"}
        footer={
          <>
            <button className="btn btn-outline" onClick={() => setModalOpen(false)}>Cancelar</button>
            <button className="btn btn-primary" onClick={save} disabled={saving}>
              {saving ? "Salvando..." : "Salvar"}
            </button>
          </>
        }
      >
        <InputGroup label="Nome *">
          <input className="input-field" value={form.name}
            onChange={e => setForm({ ...form, name: e.target.value })}
            placeholder="Nome completo" />
        </InputGroup>
        <InputGroup label="E-mail">
          <input type="email" className="input-field" value={form.email}
            onChange={e => setForm({ ...form, email: e.target.value })}
            placeholder="email@exemplo.com" />
        </InputGroup>
        <InputGroup label="Telefone">
          <input className="input-field" value={form.phone}
            onChange={e => setForm({ ...form, phone: e.target.value })}
            placeholder="(00) 00000-0000" />
        </InputGroup>
      </Modal>
    </section>
  );
}
