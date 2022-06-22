import classnames from 'classnames'

import './spinner.css'

const Spinner = ({ className, ...props }) => (
  <div className={classnames('spinner', className)} {...props}></div>
)

export default Spinner
