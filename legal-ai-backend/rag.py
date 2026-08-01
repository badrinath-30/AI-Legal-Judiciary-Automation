# rag.py
# This file searches your knowledge_base.py documents to find
# the most relevant one(s) for a given question.

from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

from knowledge_base import LEGAL_DOCUMENTS

# Prepare the searchable text once, when the app starts
_document_texts = [doc["title"] + ". " + doc["content"] for doc in LEGAL_DOCUMENTS]

_vectorizer = TfidfVectorizer(stop_words="english")
_document_vectors = _vectorizer.fit_transform(_document_texts)


def search_documents(question: str, top_k: int = 2):
    """
    Given a question, returns the top_k most relevant documents
    from LEGAL_DOCUMENTS, based on text similarity.
    """

    question_vector = _vectorizer.transform([question])

    similarity_scores = cosine_similarity(question_vector, _document_vectors)[0]

    # Get indices of the top_k highest scoring documents
    top_indices = similarity_scores.argsort()[::-1][:top_k]

    results = []
    for i in top_indices:
        score = similarity_scores[i]
        if score > 0:  # Only include documents with some relevance
            results.append({
                "title": LEGAL_DOCUMENTS[i]["title"],
                "content": LEGAL_DOCUMENTS[i]["content"],
                "score": float(score),
            })

    return results


def build_context(question: str, top_k: int = 2) -> str:
    """
    Returns a formatted string of relevant document content,
    ready to be inserted into the Groq prompt.
    """

    matches = search_documents(question, top_k=top_k)

    if not matches:
        return ""

    context_parts = []
    for m in matches:
        context_parts.append(f"[{m['title']}]\n{m['content']}")

    return "\n\n".join(context_parts)