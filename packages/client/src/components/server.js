import TcpServer from './tcpserver'

const Server = ({ kind, host, port }) => {
  if (kind === 'http') {
    const url = `https://${host}`
    return (
      <a href={url} target="_blank" rel="noopener noreferrer">
        {url}
      </a>
    )
  } else {
    return <TcpServer host={host} port={port} />
  }
}

export default Server
