export default function NewsCard({ title, excerpt, date, tag }) {
  return (
    <article className="card">
      <div className="card-head">
        <span className="badge">{tag}</span>
        <time className="muted">{new Date(date).toLocaleDateString()}</time>
      </div>
      <h3 className="card-title">{title}</h3>
      <p className="card-text">{excerpt}</p>
      <div className="card-foot">
        <button className="btn">Leer más</button>
      </div>
    </article>
  );
}
