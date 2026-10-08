import { Title } from "@radix-ui/react-dialog";

export default function ModalTitulo({ children, ...props }) {
  return (
    <Title asChild {...props}>
      {children}
    </Title>
  );
}
