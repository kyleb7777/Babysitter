import { login } from "./actions";

export default function LoginPage({
  searchParams,
}: {
  searchParams: { error?: string; next?: string };
}) {
  return (
    <div style={{ maxWidth: 400, margin: "60px auto" }}>
      <div className="card">
        <h1 className="h1" style={{ fontSize: 20 }}>Sign in</h1>
        <p className="muted" style={{ marginTop: -8 }}>
          Enter the app password to manage sitters and requests.
        </p>
        {searchParams.error && (
          <div className="error">Incorrect password.</div>
        )}
        <form action={login} className="form">
          <input type="hidden" name="next" value={searchParams.next ?? "/"} />
          <div className="field">
            <label htmlFor="password">Password</label>
            <input id="password" name="password" type="password" autoFocus required />
          </div>
          <button className="btn btnPrimary" type="submit">Sign in</button>
        </form>
      </div>
    </div>
  );
}
