import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { ApiError, accountApi, type AppUser } from './api';
import { createEmptyState, type PrototypeState } from './storage';

type StateUpdate = Partial<PrototypeState> | ((current: PrototypeState) => PrototypeState);
type AuthStatus = 'loading' | 'authenticated' | 'logged-out' | 'error';
type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

interface PrototypeContextValue {
  state: PrototypeState;
  updateState: (update: StateUpdate) => void;
  authStatus: AuthStatus;
  user: AppUser | null;
  authError: string;
  saveStatus: SaveStatus;
  saveError: string;
  signIn: () => Promise<string>;
  signOut: () => Promise<void>;
  deleteAccount: () => Promise<void>;
  refreshWorkspace: () => Promise<void>;
}

const PrototypeContext = createContext<PrototypeContextValue | null>(null);

export function PrototypeProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<PrototypeState>(createEmptyState);
  const [authStatus, setAuthStatus] = useState<AuthStatus>('loading');
  const [user, setUser] = useState<AppUser | null>(null);
  const [authError, setAuthError] = useState('');
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');
  const [saveError, setSaveError] = useState('');
  const [workspaceReady, setWorkspaceReady] = useState(false);
  const revisionRef = useRef(0);
  const saveQueue = useRef(Promise.resolve());
  const skipNextSave = useRef(false);

  const refreshWorkspace = useCallback(async () => {
    const result = await accountApi.getWorkspace();
    revisionRef.current = result.revision;
    skipNextSave.current = true;
    setState(result.workspace);
    setSaveStatus(result.revision > 0 ? 'saved' : 'idle');
    setSaveError('');
  }, []);

  useEffect(() => {
    let active = true;
    async function initialize() {
      try {
        const session = await accountApi.getSession();
        if (!active) return;
        if (!session.user) {
          setUser(null);
          setAuthStatus('logged-out');
          setWorkspaceReady(false);
          return;
        }
        setUser(session.user);
        const workspace = await accountApi.getWorkspace();
        if (!active) return;
        revisionRef.current = workspace.revision;
        skipNextSave.current = true;
        setState(workspace.workspace);
        setWorkspaceReady(true);
        setSaveStatus(workspace.revision > 0 ? 'saved' : 'idle');
        setAuthStatus('authenticated');
      } catch (error) {
        if (!active) return;
        setAuthStatus('error');
        setAuthError(error instanceof Error ? error.message : 'The account service is not available right now.');
      }
    }
    void initialize();
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (authStatus !== 'authenticated' || !workspaceReady) return;
    if (skipNextSave.current) {
      skipNextSave.current = false;
      return;
    }
    const snapshot = state;
    const timer = window.setTimeout(() => {
      saveQueue.current = saveQueue.current.catch(() => undefined).then(async () => {
        if (authStatus !== 'authenticated') return;
        setSaveStatus('saving');
        setSaveError('');
        try {
          const result = await accountApi.saveWorkspace(snapshot, revisionRef.current);
          revisionRef.current = result.revision;
          setSaveStatus('saved');
        } catch (error) {
          if (error instanceof ApiError && error.status === 401) {
            setUser(null);
            setAuthStatus('logged-out');
            setWorkspaceReady(false);
            setState(createEmptyState());
            setSaveStatus('error');
            setSaveError('Your session ended. Sign in again to continue.');
            return;
          }
          setSaveStatus('error');
          setSaveError(error instanceof ApiError && error.status === 409
            ? 'This account changed in another tab. Reload its saved workspace before making more edits.'
            : 'Your latest change could not be saved. Keep this page open and retry after the connection is restored.');
        }
      });
    }, 450);
    return () => window.clearTimeout(timer);
  }, [state, authStatus, workspaceReady]);

  const updateState = useCallback((update: StateUpdate) => {
    if (authStatus !== 'authenticated' || !workspaceReady) return;
    setState((current) => typeof update === 'function' ? update(current) : { ...current, ...update });
  }, [authStatus, workspaceReady]);

  const signIn = useCallback(async () => {
    const result = await accountApi.startLogin(window.location.origin);
    return result.authorizationUrl;
  }, []);

  const signOut = useCallback(async () => {
    await accountApi.logout();
    setUser(null);
    setState(createEmptyState());
    setWorkspaceReady(false);
    setAuthStatus('logged-out');
    setAuthError('');
    setSaveStatus('idle');
    setSaveError('');
  }, []);

  const deleteAccount = useCallback(async () => {
    await accountApi.deleteAccount();
    setUser(null);
    setState(createEmptyState());
    setWorkspaceReady(false);
    setAuthStatus('logged-out');
    setAuthError('');
    setSaveStatus('idle');
    setSaveError('');
  }, []);

  const value = useMemo(() => ({
    state, updateState, authStatus, user, authError, saveStatus, saveError,
    signIn, signOut, deleteAccount, refreshWorkspace,
  }), [state, updateState, authStatus, user, authError, saveStatus, saveError, signIn, signOut, deleteAccount, refreshWorkspace]);
  return <PrototypeContext.Provider value={value}>{children}</PrototypeContext.Provider>;
}

export function usePrototype(): PrototypeContextValue {
  const context = useContext(PrototypeContext);
  if (!context) throw new Error('usePrototype must be used inside PrototypeProvider');
  return context;
}
