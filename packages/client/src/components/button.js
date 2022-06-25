import classnames from 'classnames'

import './button.css'

const Button = ({ className, children, ...props }) => (
  <button className={classnames('btn', className)} {...props}>
    <span className="btn-content">{children}</span>
  </button>
)

export default Button
