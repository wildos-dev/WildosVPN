"""defines errors to match against grpc errors. since all errors are returned as grpcerror"""

import re

import grpclib


class XrayError(Exception):
    REGEXP = ...

    def __init__(self, details):
        self.details = details


class EmailExistsError(XrayError):
    REGEXP = re.compile(r"User (.*) already exists.")

    def __init__(self, details, email):
        self.email = email
        super().__init__(details)


class EmailNotFoundError(XrayError):
    REGEXP = re.compile(r"User (.*) not found.")

    def __init__(self, details, email):
        self.email = email
        super().__init__(details)


class TagNotFoundError(XrayError):
    REGEXP = re.compile(r"handler not found: (.*)")

    def __init__(self, details, tag):
        self.tag = tag
        super().__init__(details)


class XConnectionError(XrayError):
    REGEXP = re.compile(r"Failed to connect to remote host|Socket closed|Broken pipe")

    def __init__(self, details, tag):
        self.tag = tag
        super().__init__(details)


class UnknownError(XrayError):
    def __init__(self, details=""):
        super().__init__(details)


class RelatedError(XrayError):
    def __new__(cls, error: grpclib.exceptions.GRPCError):
        details = error.message
        for exc in (
            EmailExistsError,
            EmailNotFoundError,
            TagNotFoundError,
            XConnectionError,
        ):
            args = exc.REGEXP.findall(details)
            if not args:
                continue

            return exc(details, *args)

        return UnknownError(details)
