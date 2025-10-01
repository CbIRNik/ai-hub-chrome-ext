import clsx from "clsx"


type Props = {
  children?: React.ReactNode
  className?: string
  onClick?: () => void
}

const defaultStyles = ""

const Button = ({ children, className, onClick, ...props }: Props) => {
  return (
    <button {...props} className={clsx(defaultStyles, className)} onClick={onClick}>
      {children}
    </button>
  )
}

export { Button }
