import React from "react";
import { Link, useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";

const loginSchema = z.object({
  email: z.string().email("Enter a valid email"),
  password: z.string().min(1, "Password is required"),
});

export default function Login() {
  const [, setLocation] = useLocation();
  const form = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "admin@smartcampus.edu",
      password: "password123",
    },
  });

  function onSubmit(values: z.infer<typeof loginSchema>) {
    setLocation("/");
  }

  return (
    <div className="min-h-screen w-full flex bg-background">
      <div className="flex-1 flex flex-col justify-center px-4 sm:px-6 lg:px-20 xl:px-24">
        <div className="mx-auto w-full max-w-sm">
          <div className="mb-10 flex items-center gap-3">
            <div className="h-10 w-10 rounded bg-primary flex items-center justify-center text-primary-foreground font-bold font-mono text-lg">
              SC
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-xl tracking-tight leading-none">Smart Campus</span>
              <span className="text-xs text-muted-foreground uppercase tracking-widest mt-1 font-medium">System Portal</span>
            </div>
          </div>

          <h2 className="text-2xl font-semibold tracking-tight mb-2">Administrator Login</h2>
          <p className="text-muted-foreground text-sm mb-8">
            Access secure campus systems. Authorized personnel only.
          </p>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Work Email</FormLabel>
                    <FormControl>
                      <Input placeholder="name@domain.edu" {...field} className="font-mono text-sm h-11" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Password</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="••••••••" {...field} className="font-mono text-sm h-11" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full h-11 font-medium text-sm tracking-wide">
                Authenticate Session
              </Button>
            </form>
          </Form>

          <div className="mt-8 pt-8 border-t text-xs text-muted-foreground">
            Protected by SCIS Integrity Layer. All connection attempts are logged and monitored.
          </div>
        </div>
      </div>
      <div className="hidden lg:block lg:flex-1 relative bg-sidebar">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-transparent mix-blend-overlay"></div>
        <div className="absolute inset-0 flex flex-col items-center justify-center p-12 text-sidebar-foreground">
          <div className="max-w-md space-y-6">
            <h3 className="text-3xl font-light tracking-tight text-white/90">
              Information asymmetry is the enemy of efficient administration.
            </h3>
            <p className="text-lg text-sidebar-foreground/70 leading-relaxed">
              Consolidating registration, financials, and performance metrics into a single, high-fidelity source of truth.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
