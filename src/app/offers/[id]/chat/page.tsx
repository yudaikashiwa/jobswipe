import { redirect } from "next/navigation";

export default async function OfferChatPage(props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params;
  // 旧パスから新パスへリダイレクト
  redirect(`/chats/${id}`);
}
