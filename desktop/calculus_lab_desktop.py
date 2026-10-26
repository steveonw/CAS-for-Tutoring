#!/usr/bin/env python3
"""Offline symbolic calculator + explicit explanation boundaries. Requires sympy."""
import sympy as sp
from sympy.parsing.sympy_parser import (parse_expr, standard_transformations, implicit_multiplication_application, convert_xor)
x=sp.Symbol("x")
ALLOWED={"x":x,"sin":sp.sin,"cos":sp.cos,"tan":sp.tan,"exp":sp.exp,"log":sp.log,"ln":sp.log,"sqrt":sp.sqrt,"pi":sp.pi,"E":sp.E}
TRANSFORMS=standard_transformations+(implicit_multiplication_application,convert_xor)
def parsed(text):
    if len(text)>200 or not text or any(c not in "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ_+-*/^()., " for c in text):
        raise ValueError("Unsupported or oversized expression")
    # SymPy's parser must not be used for untrusted arbitrary input. Local-use prototype only.
    return parse_expr(text,local_dict=ALLOWED, transformations=TRANSFORMS, evaluate=False)
def solve(mode,text):
    expression=parsed(text)
    modes={"differentiate":lambda:sp.diff(expression,x),"integrate":lambda:sp.integrate(expression,x),"simplify":lambda:sp.simplify(expression),"factor":lambda:sp.factor(expression),"expand":lambda:sp.expand(expression),"solve":lambda:sp.solve(expression,x)}
    if mode not in modes:raise ValueError("Choose differentiate, integrate, simplify, factor, expand, or solve")
    result=modes[mode]()
    print("Input:",expression)
    print("Operation:",mode)
    print("Result:",result)
    print("Explanation boundary: CAS-computed result. A complete rule-by-rule derivation is not provided for every operation.")
def main():
    print("Math Dreamweaver / Calculus Lab — offline SymPy CAS")
    while True:
        mode=input("\nOperation (or quit): ").strip().lower()
        if mode in ("quit","exit","q"):break
        try:solve(mode,input("Expression in x: "))
        except Exception as e:print("Unable to compute:",e)
if __name__=="__main__":main()
