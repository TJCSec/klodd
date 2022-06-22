const Server = ({ kind, host, port }) => {
  if (kind === 'http') {
    const url = `https://${host}`
    return <a href={url}>{url}</a>
  } else {
    const address = `${host}:${port}`
    return <code>{address}</code>
  }
}

export default Server
