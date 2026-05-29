import { MessageCircleReply, Send, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { api } from "../api/client.js";
import Button from "../components/Button.jsx";
import EmptyState from "../components/EmptyState.jsx";
import ReportButton from "../components/ReportButton.jsx";
import { formatDate } from "../utils/format.js";

export default function PostDetail() {
  const { postId } = useParams();
  const [comments, setComments] = useState([]);
  const [content, setContent] = useState("");
  const [replyingTo, setReplyingTo] = useState("");
  const [replyContent, setReplyContent] = useState("");
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

  const commentTree = useMemo(() => buildCommentTree(comments), [comments]);

  const submit = async (event, parentComment = null) => {
    event.preventDefault();
    const nextContent = parentComment ? replyContent : content;
    setError("");
    try {
      const data = await api(`/forums/posts/${postId}/comments`, {
        method: "POST",
        body: JSON.stringify({
          content: nextContent,
          ...(parentComment ? { parentComment } : {}),
        }),
      });
      setComments((current) => [...current, data.comment]);
      if (parentComment) {
        setReplyContent("");
        setReplyingTo("");
      } else {
        setContent("");
      }
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <section className="rounded-lg bg-white/85 p-5 shadow-soft">
        <h1 className="text-2xl font-black">Conversation replies</h1>
        <form onSubmit={(event) => submit(event)} className="mt-4 flex gap-2">
          <input className="field" value={content} onChange={(e) => setContent(e.target.value)} placeholder="Write a thoughtful reply" required />
          <Button type="submit"><Send className="h-4 w-4" /></Button>
        </form>
      </section>
      {error && <div className="rounded-lg bg-rose-50 p-4 text-rose-700">{error}</div>}
      <section className="space-y-3">
        {commentTree.length ? commentTree.map((comment) => (
          <CommentNode
            key={comment._id}
            comment={comment}
            replyingTo={replyingTo}
            replyContent={replyContent}
            setReplyingTo={setReplyingTo}
            setReplyContent={setReplyContent}
            onSubmitReply={submit}
          />
        )) : <EmptyState title="No replies yet">Be the first to answer with care.</EmptyState>}
      </section>
    </div>
  );
}

function CommentNode({
  comment,
  replyingTo,
  replyContent,
  setReplyingTo,
  setReplyContent,
  onSubmitReply,
  depth = 0,
}) {
  const isReplying = replyingTo === comment._id;
  const canIndent = depth > 0;

  const startReply = () => {
    setReplyingTo(comment._id);
    setReplyContent("");
  };

  const cancelReply = () => {
    setReplyingTo("");
    setReplyContent("");
  };

  return (
    <div className={canIndent ? "border-l border-bean-sage/30 pl-4" : ""}>
      <article className="rounded-lg bg-white/90 p-4 shadow-sm">
        <div className="flex items-start justify-between gap-3">
          <p className="text-sm text-bean-muted">
            {comment.author?.name || "Member"} · {formatDate(comment.createdAt)}
          </p>
          <ReportButton targetType="forum_comment" targetId={comment._id} label="Report comment" />
        </div>
        <p className="mt-2 whitespace-pre-wrap text-bean-ink">{comment.content}</p>
        <div className="mt-3">
          <button
            type="button"
            onClick={startReply}
            className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-sm font-bold text-bean-teal transition hover:bg-bean-mist"
          >
            <MessageCircleReply className="h-4 w-4" />
            Reply
          </button>
        </div>

        {isReplying && (
          <form
            onSubmit={(event) => onSubmitReply(event, comment._id)}
            className="mt-3 flex gap-2"
          >
            <input
              className="field"
              value={replyContent}
              onChange={(event) => setReplyContent(event.target.value)}
              placeholder={`Reply to ${comment.author?.name || "this comment"}`}
              required
            />
            <Button type="submit">
              <Send className="h-4 w-4" />
            </Button>
            <Button type="button" variant="secondary" onClick={cancelReply}>
              <X className="h-4 w-4" />
            </Button>
          </form>
        )}
      </article>

      {comment.children?.length > 0 && (
        <div className="mt-3 space-y-3">
          {comment.children.map((child) => (
            <CommentNode
              key={child._id}
              comment={child}
              replyingTo={replyingTo}
              replyContent={replyContent}
              setReplyingTo={setReplyingTo}
              setReplyContent={setReplyContent}
              onSubmitReply={onSubmitReply}
              depth={depth + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function buildCommentTree(comments) {
  const nodesById = new Map();
  const roots = [];

  comments.forEach((comment) => {
    nodesById.set(comment._id, { ...comment, children: [] });
  });

  nodesById.forEach((comment) => {
    const parentId = getParentId(comment.parentComment);
    const parent = parentId ? nodesById.get(parentId) : null;

    if (parent) {
      parent.children.push(comment);
    } else {
      roots.push(comment);
    }
  });

  return roots;
}

function getParentId(parentComment) {
  if (!parentComment) return "";
  if (typeof parentComment === "string") return parentComment;
  return parentComment._id || "";
}
