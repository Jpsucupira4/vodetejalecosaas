import { useState, useEffect, useCallback } from "react";
import { getProfiles, getSales } from "../lib/storage";
import { supabase } from "../lib/supabase";
import { fmt } from "../lib/helpers";
import type { Profile, Sale } from "../types";
import type { ToastType } from "../hooks/useToast";
import Modal from "../components/Modal";
import InputGroup from "../components/InputGroup";
import EmptyState from "../components/EmptyState";

interface Props {
  showToast: (msg: string, type?: ToastType) => void;
}

export default function PageVendedoras({ showToast }: Props) {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [sales,    setSales]    = useState<Sale[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editId,    setEditId]    = useState<string | null>(null);
  const [saving,    setSaving]    = useState(false);
  const [form, setForm] = useState({ name: "", email: "", password: "", role: "vendedora" });

  const load = useCallback(async () => {
    const [p, s] = await Promise.all([getProfiles(), getSales()]);
    setProfiles(p); setSales(s);
  }, []);

  useEffect(() => { load(); }, [load]);

  const openNew = () => {
    setEditId(null); setForm({ name: "", email: "", password: "", role: "vendedora" }); setModalOpen(true);
  };
  const openEdit = (p: Profile) => {
    setEditId(p.id); setForm({ name: p.name, email: p.email, password: "", role: p.role }); setModalOpen(true);
  };

  const save = async () => {
    if (!form.name.trim() || !form.email.trim()) return showToast("Preencha nome e e-mail.", "error");
    if (!editId && !form.password) return showToast("Informe uma senha.", "error");
    if (form.password && form.password.length < 6) return showToast("Senha deve ter no mínimo 6 caracteres.", "error");
    setSaving(true);
    try {
      if (editId) {
        const { error } = await supabase.from("profiles").update({
          name: form.name.trim(), email: form.email.trim(), role: form.role,
        }).eq("id", editId);
        if (error) throw error;
        showToast("Usuário atualizado!", "success");
      } else {
        const { data, error } = await supabase.auth.signUp({
          email: form.email.trim(), password: form.password,
          options: { data: { name: form.name.trim() } },
        });
        if (error) throw error;
        const uid = data.user?.id;
        if (uid) {
          const { error: e2 } = await supabase.from("profiles").insert({
            id: uid, name: form.name.trim(), email: form.email.trim(), role: form.role,
          });
          if (e2) throw e2;
        }
        showToast("Vendedora cadastrada! Peça que ela confirme o e-mail.", "success");
      }
      setModalOpen(false); load();
    } catch (e: unknown) { showToast((e as Error).message, "error"); }
    finally { setSaving(false); }
  };

  return (
    <section className="page active">
      <div className="page-header">
        <h2>Vendedoras</h2><p>Gestão de usuários</p>
        <button className="btn btn-primary" onClick={openNew}>+ Nova Vendedora</button>
      </div>
      <div className="table-wrapper">
        <table className="data-table">
          <thead><tr><th>Nome</th><th>E-mail</th><th>Perfil</th><th>Total Vendas</th><th>Ações</th></tr></thead>
          <tbody>
            {profiles.length === 0
              ? <tr><td colSpan={5}><EmptyState msg="Nenhum usuário encontrado." /></td></tr>
              : profiles.map(p => {
                const total = sales.filter(s => s.sellerId === p.id).reduce((a, v) => a + Number(v.total), 0);
                return (
                  <tr key={p.id}>
                    <td><strong>{p.name}</strong></td>
                    <td>{p.email}</td>
                    <td>
                      <span className={`badge ${p.role === "admin" ? "badge-rose" : "badge-blue"}`}>
                        {p.role === "admin" ? "Admin" : "Vendedora"}
                      </span>
                    </td>
                    <td>{fmt(total)}</td>
                    <td>
                      <div className="actions">
                        <button className="btn btn-sm btn-outline" onClick={() => openEdit(p)}>Editar</button>
                      </div>
                    </td>
                  </tr>
                );
              })
            }
          </tbody>
        </table>
      </div>
      <Modal open={modalOpen} onClose={() => setModalOpen(false)}
        title={editId ? "Editar Usuário" : "Nova Vendedora"}
        footer={
          <>
            <button className="btn btn-outline" onClick={() => setModalOpen(false)}>Cancelar</button>
            <button className="btn btn-primary" onClick={save} disabled={saving}>
              {saving ? "Salvando..." : "Salvar"}
            </button>
          </>
        }
      >
        <InputGroup label="Nome Completo *">
          <input className="input-field" value={form.name}
            onChange={e => setForm({ ...form, name: e.target.value })} />
        </InputGroup>
        <InputGroup label="E-mail *">
          <input type="email" className="input-field" value={form.email}
            onChange={e => setForm({ ...form, email: e.target.value })} />
        </InputGroup>
        <InputGroup label={editId ? "Nova Senha (em branco = não alterar)" : "Senha *"}>
          <input type="password" className="input-field" value={form.password}
            onChange={e => setForm({ ...form, password: e.target.value })}
            placeholder="Mínimo 6 caracteres" />
        </InputGroup>
        <InputGroup label="Perfil">
          <select className="input-select" value={form.role}
            onChange={e => setForm({ ...form, role: e.target.value })}>
            <option value="vendedora">Vendedora</option>
            <option value="admin">Administradora</option>
          </select>
        </InputGroup>
      </Modal>
    </section>
  );
}
