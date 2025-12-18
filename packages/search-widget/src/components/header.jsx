import { Logo } from "./logo";

export const Header = () => {
  return (
    <header className="flex gap-3">
      <Logo size={40} />
      <h1 className="text-2xl font-bold text-slate-900 md:text-3xl">
        Drive Scout
      </h1>
    </header>
  );
}
