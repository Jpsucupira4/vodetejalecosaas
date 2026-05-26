/**
 * ══════════════════════════════════════════════════
 * VODETE JALECOS — auth.js
 * Módulo de Autenticação
 * ══════════════════════════════════════════════════
 */

const Auth = (() => {

  let currentUser = null;

  /** Retorna usuário logado */
  function getUser() { return currentUser; }

  /** Verifica se há sessão ativa */
  function isLoggedIn() { return currentUser !== null; }

  /** Verifica se usuário é admin */
  function isAdmin() { return currentUser?.role === 'admin'; }

  /** Hash simples (base64) — trocar por bcrypt no Supabase */
  function hashPassword(password) { return btoa(password); }

  /**
   * Login
   * @param {string} email
   * @param {string} password
   * @returns {{ success: boolean, error?: string }}
   */
  function login(email, password) {
    const user = Storage.getUserByEmail(email);
    if (!user) return { success: false, error: 'E-mail ou senha incorretos.' };

    const hashed = hashPassword(password);
    if (user.password !== hashed) return { success: false, error: 'E-mail ou senha incorretos.' };

    // Remove senha da sessão (segurança)
    const sessionUser = { ...user };
    delete sessionUser.password;

    currentUser = sessionUser;
    Storage.saveSession(sessionUser);

    return { success: true, user: sessionUser };
  }

  /** Logout */
  function logout() {
    currentUser = null;
    Storage.clearSession();
  }

  /** Restaura sessão do LocalStorage ao carregar página */
  function restoreSession() {
    const session = Storage.getSession();
    if (session) {
      currentUser = session;
      return true;
    }
    return false;
  }

  /**
   * Cadastra novo usuário (admin only)
   * @param {{ name, email, password, role }} data
   */
  function registerUser(data) {
    if (!isAdmin()) return { success: false, error: 'Permissão negada.' };

    if (!data.name || !data.email || !data.password) {
      return { success: false, error: 'Preencha todos os campos obrigatórios.' };
    }

    if (data.password.length < 6) {
      return { success: false, error: 'Senha deve ter no mínimo 6 caracteres.' };
    }

    const newUser = {
      id:        'user_' + Date.now(),
      name:      data.name.trim(),
      email:     data.email.trim().toLowerCase(),
      password:  hashPassword(data.password),
      role:      data.role || 'vendedora',
      createdAt: new Date().toISOString(),
    };

    return Storage.createUser(newUser);
  }

  /**
   * Atualiza senha de um usuário
   * @param {string} userId
   * @param {string} newPassword
   */
  function changePassword(userId, newPassword) {
    if (newPassword.length < 6) {
      return { success: false, error: 'Senha deve ter no mínimo 6 caracteres.' };
    }
    return Storage.updateUser(userId, { password: hashPassword(newPassword) });
  }

  return {
    getUser, isLoggedIn, isAdmin,
    login, logout, restoreSession,
    registerUser, changePassword,
  };

})();
