import { Send } from "lucide-react";
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { api } from "../api/client.js";
import Button from "../components/Button.jsx";
import EmptyState from "../components/EmptyState.jsx";
import { formatDate } from "../utils/format.js";

export default function PostDetail() {
  const { postId } = useParams();
  const [comments, setComments] = useState([]);
  const [content, setContent] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    api(`/forums/posts/${postId}/comments`)
      .then((data) => active && setComments(data.comments || []))
      .catch((err) => active && setError(err.message));
    return () => {
      active = false;
    };
  }, [postId]);

  const submit = async (event) => {
    event.preventDefault();
    const data = await api(`/forums/posts/${postId}/comments`, {
      method: "POST",
      body: JSON.stringify({ content }),
    });
    setComments((current) => [...current, data.comment]);
    setContent("");
  };

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <section className="rounded-lg bg-white/85 p-5 shadow-soft">
        <h1 className="text-2xl font-black">Conversation replies</h1>
        <form onSubmit={submit} className="mt-4 flex gap-2">
          <input className="field" value={content} onChange={(e) => setContent(e.target.value)} placeholder="Write a thoughtful reply" required />
          <Button type="submit"><Send className="h-4 w-4" /></Button>
        </form>
      </section>
      {error && <div className="rounded-lg bg-rose-50 p-4 text-rose-700">{error}</div>}
      <section className="space-y-3">
        {comments.length ? comments.map((comment) => (
          <article key={comment._id} className="rounded-lg bg-white/90 p-4 shadow-sm">
            <p className="text-sm text-bean-muted">{comment.author?.name || "Member"} · {formatDate(comment.createdAt)}</p>
            <p className="mt-2 text-bean-ink">{comment.content}</p>
          </article>
        )) : <EmptyState title="No replies yet">Be the first to answer with care.</EmptyState>}
      </section>
    </div>
  );
}
