import { Slot } from "@radix-ui/react-slot";
import { cva } from "class-variance-authority";
import { twMerge } from "tailwind-merge";

const buttonVariants = cva(
  "cursor-pointer focus-visible:border-primary focus-visible:ring-primary/50 aria-invalid:ring-red-500/20 dark:aria-invalid:ring-red-400/40 aria-invalid:border-red-500 inline-flex shrink-0 items-center justify-center gap-2 rounded-md text-sm font-medium whitespace-nowrap transition-all outline-none focus-visible:ring-[3px] disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        primary:
          "bg-primary text-white hover:bg-elm-700 hover:shadow-lg",
        secondary:
          " text-gray-800 hover:bg-elm-100 border-elm-800 border-2 shadow-sm",
        link: "text-primary hover:text-astral-700 dark:hover:text-astral-300 px-0 underline-offset-4 hover:underline",
        outline:
          "border-astral-400 bg-background text-astral-700 dark:text-astral-300 hover:bg-astral-100 hover:border-astral-500 dark:hover:bg-astral-900 dark:hover:border-astral-400 border-2",
        ghost:
          "text-astral-700 dark:text-astral-300 hover:bg-astral-100 hover:text-astral-800 dark:hover:bg-astral-900 dark:hover:text-astral-200",
        destructive:
          "bg-red-600 text-white hover:bg-red-700 shadow-md hover:shadow-lg",
        success:
          "bg-green-600 text-white hover:bg-green-700 shadow-md hover:shadow-lg",
        accent:
          "bg-blue-600 text-white hover:bg-astral-600 dark:hover:bg-astral-400 shadow-md hover:shadow-lg",
      },
      size: {
        default: "h-9 px-4 py-2 has-[>svg]:px-3",
        sm: "h-8 gap-1.5 rounded-md px-3 text-xs has-[>svg]:px-2.5",
        lg: "h-11 rounded-md px-8 text-base has-[>svg]:px-6",
        xl: "h-12 rounded-lg px-10 text-lg font-semibold has-[>svg]:px-8",
        icon: "size-9",
        "icon-sm": "size-8",
        "icon-lg": "size-10",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "default",
    },
  },
);


const Button = ({ className, variant, size, asChild, ...props }) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        data-slot="button"
        className={twMerge(buttonVariants({ variant, size }), className)}
        {...props}
      />
    );
  };
Button.displayName = "Button";

export { Button };
