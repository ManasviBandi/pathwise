from setuptools import find_packages, setup

setup(
    name="pathwise-research",
    version="0.1.0",
    packages=find_packages(),
    install_requires=["numpy>=1.26", "scipy>=1.11"],
)