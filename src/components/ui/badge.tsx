import { cn } from '@/lib/utils'

interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'secondary' | 'outline' | 'purple' | 'cyan'
}

export function Badge({ className, variant = 'default', ...props }: BadgeProps) {
  return (
    <div className={cn('inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold transition-colors',
      { 'bg-purple-600 text-white': variant === 'default', 'bg-gray-100 text-gray-800': variant === 'secondary',
        'border border-purple-300 text-purple-700 bg-purple-50': variant === 'outline',
        'bg-gradient-to-r from-purple-600 to-purple-800 text-white': variant === 'purple',
        'bg-gradient-to-r from-cyan-500 to-blue-500 text-white': variant === 'cyan' }, className)} {...props} />
  )
}
