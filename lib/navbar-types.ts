export type NavbarUser = {
  name: string;
  email: string;
  image: string | null;
  initials: string;
};

export type NavbarState =
  | { status: "guest" }
  | { status: "authenticated"; user: NavbarUser; isAdmin: boolean };
